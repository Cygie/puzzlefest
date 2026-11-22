import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from '@/app/App';

import { publishedPuzzles } from './data';
import { saveFound } from './logic/progress';

const go = (hash: string) =>
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

afterEach(() => {
  localStorage.clear();
  window.location.hash = '';
});

describe('WoordslangPage', () => {
  it('lists puzzles by hint and opens one; back returns to the list', async () => {
    const user = userEvent.setup();
    go('#/woordslang');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Woordslang' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Woordslang' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const fruit = publishedPuzzles().find((p) => p.id === 'fruit')!;
    await user.click(screen.getByRole('button', { name: new RegExp(fruit.hint) }));
    expect(window.location.hash).toBe('#/woordslang/fruit');
    expect(screen.getByText(fruit.hint)).toBeInTheDocument();
    expect(screen.getByTestId('slang-grid')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '← Alle puzzels' }));
    expect(screen.getByRole('list', { name: 'Puzzels' })).toBeInTheDocument();
  });

  it('shows progress and solved puzzles in the list', () => {
    const [first, second] = publishedPuzzles();
    saveFound(
      first!.id,
      first!.words.map((w) => w.letters),
    );
    saveFound(second!.id, [second!.words[0]!.letters]);
    go('#/woordslang');
    render(<App />);
    expect(
      screen.getByRole('button', { name: new RegExp(`${first!.theme}.*Opgelost`) }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`Bezig: 1 van ${second!.words.length}`)),
    ).toBeInTheDocument();
  });

  it('sends an unknown puzzle back to the list with a notice', () => {
    go('#/woordslang/bestaat-niet');
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('Deze puzzel bestaat niet');
    expect(window.location.hash).toBe('#/woordslang');
  });

  it('is linked from the home page', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /Woordslang.*Raad het thema/ })).toHaveAttribute(
      'href',
      '#/woordslang',
    );
  });
});
