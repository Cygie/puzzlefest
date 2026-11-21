import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadSaved, savePuzzle, updateProgress } from './logic/savedPuzzles';
import { encodePuzzle } from './logic/shareCode';
import { TEST_PUZZLE } from './logic/testPuzzle';
import { WoordzoekerPage } from './WoordzoekerPage';

const CELL = 50;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 5 * CELL,
    height: 5 * CELL,
    right: 5 * CELL,
    bottom: 5 * CELL,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const at = (row: number, col: number) => ({
  clientX: col * CELL + CELL / 2,
  clientY: row * CELL + CELL / 2,
  pointerId: 1,
});

function swipe(from: [number, number], to: [number, number]) {
  const grid = screen.getByTestId('play-grid');
  fireEvent.pointerDown(grid, at(...from));
  fireEvent.pointerMove(grid, at(...to));
  fireEvent.pointerUp(grid, at(...to));
}

describe('WoordzoekerPage – saving', () => {
  it('saves a generated puzzle and lists it under Mijn puzzels', async () => {
    const user = userEvent.setup();
    render(<WoordzoekerPage />);
    expect(screen.getByRole('button', { name: 'Mijn puzzels (0)' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Woord toevoegen'), 'kat, hond{Enter}');
    await user.click(screen.getByRole('button', { name: 'Genereer' }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(screen.getByRole('button', { name: '✓ Opgeslagen' })).toBeDisabled();
    expect(loadSaved()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Nieuwe puzzel' }));
    await user.click(screen.getByRole('button', { name: 'Mijn puzzels (1)' }));
    expect(screen.getByRole('heading', { name: 'Mijn puzzels' })).toBeInTheDocument();
  });

  it('restores progress, records the best time and shows a record', async () => {
    const result = savePuzzle(TEST_PUZZLE, { found: [], elapsedMs: 30_000 });
    if (!result.ok) throw new Error(result.reason);
    const user = userEvent.setup();
    const { unmount } = render(<WoordzoekerPage />);

    await user.click(screen.getByRole('button', { name: 'Mijn puzzels (1)' }));
    await user.click(screen.getByRole('button', { name: `${result.saved.name} spelen` }));
    expect(screen.getByLabelText('Tijd 0:30')).toBeInTheDocument();

    swipe([0, 0], [0, 2]);
    // Progress of a saved puzzle is written when a word is found.
    expect(loadSaved()[0]?.progress.found.map((f) => f.letters)).toEqual(['KAT']);

    swipe([1, 0], [1, 3]);
    swipe([2, 0], [2, 2]);
    expect(screen.getByText('🏆 Nieuw record!')).toBeInTheDocument();
    expect(screen.getByText(/Beste tijd:/)).toBeInTheDocument();
    expect(loadSaved()[0]?.bestTimeMs).toBeGreaterThanOrEqual(30_000);
    unmount();
  });
});

describe('WoordzoekerPage – share links', () => {
  afterEach(() => {
    window.location.hash = '';
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('opens a puzzle from a link and cleans up the address', async () => {
    const { encodePuzzle } = await import('./logic/shareCode');
    window.location.hash = `#/woordzoeker?p=${encodePuzzle(TEST_PUZZLE)}`;
    render(<WoordzoekerPage />);
    expect(screen.getByText('0 / 3')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/woordzoeker/spel');
    swipe([0, 0], [0, 2]);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('shows a Dutch error for an invalid link', () => {
    window.location.hash = '#/woordzoeker?p=kapot';
    render(<WoordzoekerPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Deze link is ongeldig of beschadigd.');
    expect(screen.getByRole('heading', { name: 'Nieuwe woordzoeker' })).toBeInTheDocument();
  });

  it('copies a share link that reopens the same puzzle', async () => {
    const user = userEvent.setup();
    // After userEvent.setup(), which installs its own clipboard stub.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { unmount } = render(<WoordzoekerPage />);
    await user.type(screen.getByLabelText('Woord toevoegen'), 'kat, hond, vis{Enter}');
    await user.click(screen.getByRole('button', { name: 'Genereer' }));
    const grid = screen.getByRole('img', { name: /Woordzoeker van/ }).textContent;

    await user.click(screen.getByRole('button', { name: 'Delen' }));
    expect(await screen.findByText(/Link gekopieerd!/)).toBeInTheDocument();
    const url = new URL(writeText.mock.calls[0]![0] as string);
    expect(url.hash).toMatch(/^#\/woordzoeker\?p=[A-Za-z0-9_-]+$/);
    unmount();

    window.location.hash = url.hash;
    render(<WoordzoekerPage />);
    expect(screen.getByRole('img', { name: /Woordzoeker van/ }).textContent).toBe(grid);
  });
});

describe('WoordzoekerPage – back button navigation', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  const back = async () => {
    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  };

  const KAT = { letters: 'KAT', start: { row: 0, col: 0 }, end: { row: 0, col: 2 } };

  function seedSaved(found = [KAT]) {
    const result = savePuzzle(TEST_PUZZLE, { found: [], elapsedMs: 0 });
    if (!result.ok) throw new Error(result.reason);
    updateProgress(result.saved.id, { found, elapsedMs: 12_000 });
    return result.saved;
  }

  it('goes back from the play screen to setup', async () => {
    window.location.hash = '#/woordzoeker';
    const user = userEvent.setup();
    render(<WoordzoekerPage />);
    await user.type(screen.getByLabelText('Woord toevoegen'), 'kat, hond{Enter}');
    await user.click(screen.getByRole('button', { name: 'Genereer' }));
    await waitFor(() => expect(window.location.hash).toBe('#/woordzoeker/spel'));
    expect(screen.getByText('0 / 2')).toBeInTheDocument();

    await back();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Nieuwe woordzoeker' })).toBeInTheDocument(),
    );
    expect(window.location.hash).toBe('#/woordzoeker');
  });

  it('goes back from a saved puzzle to Mijn puzzels and then to setup', async () => {
    const saved = seedSaved();
    window.location.hash = '#/woordzoeker';
    const user = userEvent.setup();
    render(<WoordzoekerPage />);

    await user.click(screen.getByRole('button', { name: 'Mijn puzzels (1)' }));
    await waitFor(() => expect(window.location.hash).toBe('#/woordzoeker/mijn'));
    await user.click(await screen.findByRole('button', { name: `${saved.name} spelen` }));
    await waitFor(() => expect(window.location.hash).toBe(`#/woordzoeker/spel/${saved.id}`));
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();

    await back();
    expect(await screen.findByRole('heading', { name: 'Mijn puzzels' })).toBeInTheDocument();
    await back();
    expect(await screen.findByRole('heading', { name: 'Nieuwe woordzoeker' })).toBeInTheDocument();
  });

  it('keeps playing when saving and replaces the address without a new history entry', async () => {
    window.location.hash = `#/woordzoeker?p=${encodePuzzle(TEST_PUZZLE)}`;
    const user = userEvent.setup();
    render(<WoordzoekerPage />);
    swipe([0, 0], [0, 2]);
    const entries = window.history.length;

    await user.click(screen.getByRole('button', { name: 'Opslaan' }));
    const id = loadSaved()[0]!.id;
    await waitFor(() => expect(window.location.hash).toBe(`#/woordzoeker/spel/${id}`));
    expect(window.history.length).toBe(entries);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '✓ Opgeslagen' })).toBeInTheDocument();
  });

  it('reopens a saved puzzle with progress after a reload', () => {
    const saved = seedSaved();
    window.location.hash = `#/woordzoeker/spel/${saved.id}`;
    render(<WoordzoekerPage />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Tijd 0:12')).toBeInTheDocument();
  });

  it('sends /spel without a puzzle in memory to setup', async () => {
    window.location.hash = '#/woordzoeker/spel';
    render(<WoordzoekerPage />);
    await waitFor(() => expect(window.location.hash).toBe('#/woordzoeker'));
    expect(await screen.findByRole('heading', { name: 'Nieuwe woordzoeker' })).toBeInTheDocument();
  });

  it('explains when a saved puzzle no longer exists', async () => {
    window.location.hash = '#/woordzoeker/spel/bestaat-niet';
    render(<WoordzoekerPage />);
    expect(await screen.findByRole('heading', { name: 'Mijn puzzels' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('niet (meer) opgeslagen');
  });

  it('resumes an unsaved puzzle after back and forward', async () => {
    window.location.hash = `#/woordzoeker?p=${encodePuzzle(TEST_PUZZLE)}`;
    const user = userEvent.setup();
    render(<WoordzoekerPage />);
    swipe([0, 0], [0, 2]);
    await user.click(screen.getByRole('button', { name: 'Nieuwe puzzel' }));
    expect(await screen.findByRole('heading', { name: 'Nieuwe woordzoeker' })).toBeInTheDocument();

    await back();
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();
  });
});
