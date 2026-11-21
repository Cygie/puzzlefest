import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadSaved, recordCompletion, savePuzzle, updateProgress } from '../logic/savedPuzzles';
import { TEST_PUZZLE } from '../logic/testPuzzle';
import { SavedPuzzlesScreen } from './SavedPuzzlesScreen';

afterEach(() => localStorage.clear());

function seed() {
  const result = savePuzzle(TEST_PUZZLE, { found: [], elapsedMs: 0 }, new Date('2026-11-21'));
  if (!result.ok) throw new Error(result.reason);
  return result.saved;
}

describe('SavedPuzzlesScreen', () => {
  it('shows an empty state', () => {
    render(<SavedPuzzlesScreen onOpen={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/nog geen puzzels opgeslagen/)).toBeInTheDocument();
  });

  it('lists puzzles with details and progress', () => {
    const { id } = seed();
    updateProgress(id, {
      found: [{ letters: 'KAT', start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }],
      elapsedMs: 1000,
    });
    recordCompletion(id, 151_000);
    render(<SavedPuzzlesScreen onOpen={() => {}} onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Dieren · 21 nov' })).toBeInTheDocument();
    expect(screen.getByText(/Dieren · 5×5 · Moeilijk/)).toBeInTheDocument();
    expect(screen.getByText('1 / 3 gevonden · beste tijd 2:31')).toBeInTheDocument();
  });

  it('opens a puzzle', async () => {
    const saved = seed();
    const onOpen = vi.fn();
    render(<SavedPuzzlesScreen onOpen={onOpen} onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: `${saved.name} spelen` }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: saved.id }));
  });

  it('renames a puzzle', async () => {
    const saved = seed();
    const user = userEvent.setup();
    render(<SavedPuzzlesScreen onOpen={() => {}} onBack={() => {}} />);
    await user.click(screen.getByRole('button', { name: `${saved.name} hernoemen` }));
    const input = screen.getByLabelText('Nieuwe naam');
    await user.clear(input);
    await user.type(input, 'Voor oma{Enter}');
    expect(screen.getByRole('heading', { name: 'Voor oma' })).toBeInTheDocument();
    expect(loadSaved()[0]?.name).toBe('Voor oma');
  });

  it('deletes only after confirmation', async () => {
    const saved = seed();
    const user = userEvent.setup();
    render(<SavedPuzzlesScreen onOpen={() => {}} onBack={() => {}} />);
    await user.click(screen.getByRole('button', { name: `${saved.name} verwijderen` }));
    await user.click(screen.getByRole('button', { name: 'Nee' }));
    expect(loadSaved()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: `${saved.name} verwijderen` }));
    expect(screen.getByText('Weet je het zeker?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ja, verwijderen' }));
    expect(loadSaved()).toHaveLength(0);
    expect(screen.getByText(/nog geen puzzels opgeslagen/)).toBeInTheDocument();
  });
});
