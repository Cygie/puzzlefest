import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Puzzle } from '../logic/types';
import { SetupScreen } from './SetupScreen';

afterEach(() => localStorage.clear());

function setup() {
  const onGenerated = vi.fn<(puzzle: Puzzle) => void>();
  const user = userEvent.setup();
  const view = render(<SetupScreen onGenerated={onGenerated} />);
  return { user, onGenerated, ...view };
}

const wordList = () => screen.queryByRole('list', { name: 'Woordenlijst' });
const listedWords = () =>
  within(wordList()!)
    .getAllByRole('listitem')
    .map((li) => li.querySelector('span')?.textContent);

async function addWords(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText('Woord toevoegen'), `${text}{Enter}`);
}

describe('SetupScreen', () => {
  it('fills the word list when a theme is chosen', async () => {
    const { user } = setup();
    expect(wordList()).toBeNull();
    await user.click(screen.getByRole('radio', { name: 'Dieren' }));
    expect(screen.getByRole('radio', { name: 'Dieren' })).toHaveAttribute('aria-checked', 'true');
    expect(listedWords()).toHaveLength(11); // suggested for 10×10
  });

  it('adds, pastes and removes words', async () => {
    const { user } = setup();
    await addWords(user, 'kat');
    await addWords(user, 'hond, vis; ijs-beer');
    expect(listedWords()).toEqual(['kat', 'hond', 'vis', 'ijs-beer']);

    await user.click(screen.getByRole('button', { name: 'vis verwijderen' }));
    expect(listedWords()).toEqual(['kat', 'hond', 'ijs-beer']);

    await user.click(screen.getByRole('button', { name: 'Alles wissen' }));
    expect(wordList()).toBeNull();
  });

  it('explains invalid and duplicate words', async () => {
    const { user } = setup();
    await addWords(user, 'kat');
    await addWords(user, 'KAT, a, h0nd');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('"KAT" staat al in de lijst.');
    expect(alert).toHaveTextContent('te kort');
    expect(alert).toHaveTextContent('Gebruik alleen letters');
    expect(listedWords()).toEqual(['kat']);
    expect(screen.getByLabelText('Woord toevoegen')).toHaveValue('a, h0nd');
  });

  it('marks words that are too long for the grid', async () => {
    const { user } = setup();
    await addWords(user, 'brandweerman');
    expect(screen.getByText('te lang')).toBeInTheDocument();
  });

  it('keeps width and height within 5–20', async () => {
    const { user } = setup();
    const lower = screen.getByRole('button', { name: 'Breedte verlagen' });
    for (let i = 0; i < 8; i++) await user.click(lower);
    expect(
      within(screen.getByRole('group', { name: 'Breedte' })).getByRole('status'),
    ).toHaveTextContent('5');
    expect(lower).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Hoogte verhogen' }));
    expect(
      within(screen.getByRole('group', { name: 'Hoogte' })).getByRole('status'),
    ).toHaveTextContent('11');
  });

  it('switches difficulty and shows its explanation', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Moeilijk' }));
    expect(screen.getByText(/ook achterstevoren/)).toBeInTheDocument();
  });

  it('shows live feedback for the solution word', async () => {
    const { user } = setup();
    await addWords(user, 'kat');
    await user.type(screen.getByLabelText(/De letters die overblijven/), 'klaar');
    expect(screen.getByText(/Nog \d+ letters nodig/)).toBeInTheDocument();
  });

  it('refills an untouched theme list when a solution word is added', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Dieren' }));
    const before = listedWords();
    await user.type(screen.getByLabelText(/De letters die overblijven/), 'klaar');
    // With a solution the list covers about half the grid; the rest comes from the theme.
    expect(listedWords()).not.toEqual(before);
    expect(screen.getByText(/aangevuld met woorden uit het thema/)).toBeInTheDocument();
    expect(screen.getByLabelText(/De letters die overblijven/)).toHaveValue('klaar');
  });

  it('keeps an edited theme list when a solution word is added', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Dieren' }));
    await addWords(user, 'eenhoorn');
    const before = listedWords();
    await user.type(screen.getByLabelText(/De letters die overblijven/), 'klaar');
    expect(listedWords()).toEqual(before);
  });

  it('generates a puzzle with a solution word topped up from the theme', async () => {
    const { user, onGenerated } = setup();
    await user.click(screen.getByRole('radio', { name: 'Dieren' }));
    await user.type(screen.getByLabelText(/De letters die overblijven/), 'Goed gedaan');
    const listed = listedWords();
    await user.click(screen.getByRole('button', { name: 'Genereer' }));
    await waitFor(() => expect(onGenerated).toHaveBeenCalledTimes(1), { timeout: 10_000 });
    const puzzle = onGenerated.mock.calls[0]![0];
    expect(puzzle.solution?.letters).toBe('GOEDGEDAAN');
    expect(puzzle.words.length).toBeGreaterThan(listed.length);
  }, 15_000);

  it('generates a puzzle', async () => {
    const { user, onGenerated } = setup();
    await addWords(user, 'kat, hond, vis');
    await user.click(screen.getByRole('button', { name: 'Genereer' }));
    await waitFor(() => expect(onGenerated).toHaveBeenCalledTimes(1), { timeout: 10_000 });
    const puzzle = onGenerated.mock.calls[0]![0];
    expect(puzzle.words.map((w) => w.letters)).toEqual(['KAT', 'HOND', 'VIS']);
    expect(puzzle.grid).toHaveLength(10);
  });

  it('shows a busy button while generating', async () => {
    const { user, onGenerated } = setup();
    await addWords(user, 'kat, hond');
    await user.click(screen.getByRole('button', { name: 'Genereer' }));
    expect(screen.getByRole('button', { name: 'Puzzel maken…' })).toBeDisabled();
    await waitFor(() => expect(onGenerated).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Genereer' })).toBeEnabled();
  });

  it('disables Genereer without words', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Genereer' })).toBeDisabled();
  });

  it('offers to continue without words that do not fit', async () => {
    const { user, onGenerated } = setup();
    const lower = screen.getByRole('button', { name: 'Breedte verlagen' });
    const lowerH = screen.getByRole('button', { name: 'Hoogte verlagen' });
    for (let i = 0; i < 5; i++) {
      await user.click(lower);
      await user.click(lowerH);
    }
    await addWords(user, 'kat, brandweerman');
    await user.click(screen.getByRole('button', { name: 'Genereer' }));
    expect(await screen.findByText('1 woord past niet in de puzzel.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Doorgaan zonder deze woorden' }));
    expect(onGenerated.mock.calls[0]![0].words.map((w) => w.letters)).toEqual(['KAT']);
  });

  it('remembers settings after a reload', async () => {
    const { user, unmount } = setup();
    await addWords(user, 'kat, hond');
    await user.click(screen.getByRole('radio', { name: 'Makkelijk' }));
    unmount();
    setup();
    expect(listedWords()).toEqual(['kat', 'hond']);
    expect(screen.getByRole('radio', { name: 'Makkelijk' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
