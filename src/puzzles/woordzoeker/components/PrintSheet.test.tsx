import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_PUZZLE } from '../logic/testPuzzle';
import type { Puzzle } from '../logic/types';
import { PlayScreen } from './PlayScreen';
import { printCellSize, PrintSheet } from './PrintSheet';

const WITH_SOLUTION: Puzzle = {
  ...TEST_PUZZLE,
  solution: { display: 'Goed', letters: 'GOEDDXYZQAWVUAN' },
};

afterEach(() => vi.restoreAllMocks());

describe('PrintSheet', () => {
  it('prints title, details, the grid and a sorted word list', () => {
    render(<PrintSheet puzzle={TEST_PUZZLE} withAnswers={false} />);
    const sheet = screen.getByTestId('print-sheet');
    expect(within(sheet).getByRole('heading', { name: 'Woordzoeker' })).toBeInTheDocument();
    expect(within(sheet).getByText('Dieren · 5×5 · Moeilijk')).toBeInTheDocument();
    expect(sheet.textContent).toContain('KATGOHONDE');
    const words = within(screen.getByRole('list', { name: 'Woordenlijst (afdruk)' }))
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(words).toEqual(['hond', 'kat', 'vis']);
  });

  it('adds a blank per solution letter', () => {
    render(<PrintSheet puzzle={WITH_SOLUTION} withAnswers={false} />);
    expect(screen.getAllByTestId('solution-blank')).toHaveLength(15);
  });

  it('adds the answer page only when requested', () => {
    const { rerender } = render(<PrintSheet puzzle={WITH_SOLUTION} withAnswers={false} />);
    expect(screen.queryByTestId('answer-page')).toBeNull();

    rerender(<PrintSheet puzzle={WITH_SOLUTION} withAnswers />);
    const answers = screen.getByTestId('answer-page');
    expect(within(answers).getAllByTestId('answer-stroke')).toHaveLength(3);
    expect(within(answers).getByText('Goed')).toBeInTheDocument();
  });

  it('fits a 20×20 grid within the A4 width', () => {
    const big: Puzzle = {
      ...TEST_PUZZLE,
      width: 20,
      height: 20,
      grid: Array.from({ length: 20 }, () => 'A'.repeat(20)),
      words: [],
    };
    render(<PrintSheet puzzle={big} withAnswers={false} />);
    const grid = screen
      .getByTestId('print-sheet')
      .querySelector('[style*="grid-template-columns"]');
    // 1 word, no solution → limited by width: 180 mm / 20 = 9 mm cells.
    expect((grid as HTMLElement).style.width).toBe('180mm');
  });
});

describe('printCellSize', () => {
  const pageHeight = (w: number, h: number, words: number, solution: number) => {
    const cell = printCellSize(w, h, words, solution);
    // Must match the reserved heights used in printCellSize (title, list, solution, safety).
    const rows = Math.ceil(words / 4);
    const solutionRows = solution > 0 ? Math.ceil((solution + 2) / 20) : 0;
    return 22 + (words > 0 ? 16 + rows * 6.5 : 0) + solutionRows * 16 + cell * h;
  };

  it.each([
    [5, 5, 6, 0],
    [10, 10, 12, 0],
    [10, 10, 16, 11],
    [15, 15, 25, 13],
    [20, 20, 25, 0],
    [5, 20, 10, 0],
    [20, 5, 10, 0],
  ])('fits %s×%s with %s words and %s solution letters on one sheet', (w, h, words, solution) => {
    expect(pageHeight(w, h, words, solution)).toBeLessThanOrEqual(240);
    expect(printCellSize(w, h, words, solution) * w).toBeLessThanOrEqual(180);
  });

  it('never exceeds 12 mm cells', () => {
    expect(printCellSize(5, 5, 4, 0)).toBe(12);
  });
});

describe('PlayScreen – printing', () => {
  it('prints with or without answers', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PlayScreen puzzle={TEST_PUZZLE} onNew={() => {}} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Met antwoorden' }));
    expect(screen.getByTestId('answer-page')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Afdrukken/ }));
    expect(print).toHaveBeenCalledTimes(1);
  });
});
