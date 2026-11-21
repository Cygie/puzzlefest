import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_PUZZLE } from '../logic/testPuzzle';
import type { Puzzle } from '../logic/types';
import { PlayScreen } from './PlayScreen';
import { PrintSheet } from './PrintSheet';

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
    expect((grid as HTMLElement).style.width).toBe('175mm');
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
