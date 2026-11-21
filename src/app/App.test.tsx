import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { parseHash } from './useHashRoute';

describe('App shell', () => {
  it('shows the Dutch home page by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Welkom bij PuzzleFest' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Hoofdmenu' })).toBeInTheDocument();
  });

  it('navigates to the Woordzoeker page via the hash route', () => {
    render(<App />);
    act(() => {
      window.location.hash = '#/woordzoeker';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { name: 'Nieuwe woordzoeker' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Woordzoeker' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

describe('parseHash', () => {
  it('maps known hashes and falls back to home', () => {
    expect(parseHash('')).toBe('home');
    expect(parseHash('#/')).toBe('home');
    expect(parseHash('#/woordzoeker')).toBe('woordzoeker');
    expect(parseHash('#/woordzoeker?p=abc')).toBe('woordzoeker');
    expect(parseHash('#/bestaat-niet')).toBe('home');
  });
});
