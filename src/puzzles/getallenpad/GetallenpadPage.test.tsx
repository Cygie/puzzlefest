import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { publishedPuzzles } from './data';
import { GetallenpadPage, routePuzzle } from './GetallenpadPage';
import { saveProgress } from './logic/progress';

const go = (hash: string) =>
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

afterEach(() => {
  localStorage.clear();
  window.location.hash = '';
});

describe('GetallenpadPage', () => {
  it('lists the puzzles grouped by level, with status', () => {
    const [first] = publishedPuzzles();
    const entries = first!.givens.flat().map(() => null as number | null);
    entries[first!.givens.flat().indexOf(null)] = 2;
    saveProgress(first!.id, entries);
    go('#/getallenpad');
    render(<GetallenpadPage />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Makkelijk', 'Normaal', 'Moeilijk']);
    const easy = screen.getByRole('list', { name: 'Makkelijk' });
    expect(within(easy).getAllByRole('button')).toHaveLength(3);
    expect(within(easy).getAllByRole('button')[0]).toHaveTextContent(/Bezig: 1 van \d+ ingevuld/);
  });

  it('opens a puzzle and goes back', async () => {
    const user = userEvent.setup();
    go('#/getallenpad');
    render(<GetallenpadPage />);
    await user.click(
      within(screen.getByRole('list', { name: 'Moeilijk' })).getAllByRole('button')[0]!,
    );
    const hard = publishedPuzzles().find((p) => p.level === 'moeilijk')!;
    expect(window.location.hash).toBe(routePuzzle(hard.id));
    expect(screen.getByTestId('pad-grid')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '← Alle puzzels' }));
    expect(screen.getByRole('heading', { name: 'Getallenpad' })).toBeInTheDocument();
  });

  it('returns to the list with a notice for an unknown puzzle', () => {
    go('#/getallenpad/bestaat-niet');
    render(<GetallenpadPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Deze puzzel bestaat niet');
    expect(window.location.hash).toBe('#/getallenpad');
  });
});
