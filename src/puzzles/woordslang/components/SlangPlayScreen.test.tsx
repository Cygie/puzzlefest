import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cell } from '@/shared/grid/cells';

import { loadFound, saveFound } from '../logic/progress';
import { testPuzzle } from '../logic/testPuzzle';
import { MESSAGE_MS, SlangPlayScreen } from './SlangPlayScreen';

const puzzle = testPuzzle();
const CELL = 50;
const word = (letters: string) => puzzle.words.find((w) => w.letters === letters)!;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: puzzle.width * CELL,
    height: puzzle.height * CELL,
    right: puzzle.width * CELL,
    bottom: puzzle.height * CELL,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});
afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

const at = ({ row, col }: Cell) => ({
  clientX: col * CELL + CELL / 2,
  clientY: row * CELL + CELL / 2,
  pointerId: 1,
});
const grid = () => screen.getByTestId('slang-grid');
function drag(path: readonly Cell[]) {
  fireEvent.pointerDown(grid(), at(path[0]!));
  for (const cell of path.slice(1)) fireEvent.pointerMove(grid(), at(cell));
  fireEvent.pointerUp(grid(), at(path[path.length - 1]!));
}
function tap(cell: Cell) {
  fireEvent.pointerDown(grid(), at(cell));
  fireEvent.pointerUp(grid(), at(cell));
}

function setup() {
  const onBack = vi.fn();
  const view = render(<SlangPlayScreen puzzle={puzzle} onBack={onBack} />);
  return { onBack, ...view };
}

const strokes = () => within(grid()).queryAllByTestId('word-stroke');

describe('SlangPlayScreen', () => {
  it('shows the hint and the count', () => {
    setup();
    expect(screen.getByText('Gezond en zoet')).toBeInTheDocument();
    expect(screen.getByText(`0 van ${puzzle.words.length} woorden gevonden`)).toBeInTheDocument();
  });

  it('marks a word found by dragging its path, and saves it', () => {
    setup();
    drag(word('KIWI').path);
    expect(strokes()).toHaveLength(1);
    expect(screen.getByText(`1 van ${puzzle.words.length} woorden gevonden`)).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Gevonden woorden' })).getByText('kiwi'),
    ).toBeInTheDocument();
    expect(loadFound(puzzle)).toEqual(['KIWI']);
  });

  it('marks the key word in its own colour', () => {
    setup();
    drag(word('FRUITMAND').path);
    expect(strokes()[0]).toHaveAttribute('stroke', '#ffc43d');
    expect(screen.getByText(/sleutelwoord/)).toBeInTheDocument();
  });

  it('finds a word by tapping its cells', () => {
    setup();
    const path = word('PEER').path;
    for (const cell of path) tap(cell);
    tap(path[path.length - 1]!);
    expect(strokes()).toHaveLength(1);
  });

  it('explains a wrong path and hides the message after a while', () => {
    vi.useFakeTimers();
    setup();
    drag([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ]);
    expect(screen.getByText('Geen woord van dit thema.')).toBeInTheDocument();
    expect(strokes()).toHaveLength(0);
    act(() => vi.advanceTimersByTime(MESSAGE_MS));
    expect(screen.queryByText('Geen woord van dit thema.')).toBeNull();
  });

  it('says when a word was already found', () => {
    setup();
    drag(word('KIWI').path);
    drag([...word('KIWI').path].reverse());
    expect(screen.getByText('Dat woord heb je al gevonden.')).toBeInTheDocument();
    expect(strokes()).toHaveLength(1);
  });

  it('completes when every word is found and can be played again', () => {
    const { onBack } = setup();
    for (const w of puzzle.words) drag(w.path);
    expect(screen.getByRole('heading', { name: 'Opgelost!' })).toBeInTheDocument();
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Andere puzzel' }));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw spelen' }));
    expect(strokes()).toHaveLength(0);
    expect(loadFound(puzzle)).toEqual([]);
  });

  it('restores progress', () => {
    saveFound(puzzle.id, ['KIWI', 'PEER']);
    setup();
    expect(strokes()).toHaveLength(2);
    expect(screen.getByText(`2 van ${puzzle.words.length} woorden gevonden`)).toBeInTheDocument();
  });
});
