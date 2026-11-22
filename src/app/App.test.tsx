import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { parseHash, parsePath } from './useHashRoute';

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

  it('opens the woordslang admin page in dev builds', async () => {
    window.location.hash = '#/woordslang/beheer';
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Woordslang beheer' })).toBeInTheDocument();
    window.location.hash = '';
  });
});

describe('parseHash', () => {
  it('maps known hashes and falls back to home', () => {
    expect(parseHash('')).toBe('home');
    expect(parseHash('#/')).toBe('home');
    expect(parseHash('#/woordzoeker')).toBe('woordzoeker');
    expect(parseHash('#/woordzoeker?p=abc')).toBe('woordzoeker');
    expect(parseHash('#/bestaat-niet')).toBe('home');
    expect(parseHash('#/woordzoeker/mijn')).toBe('woordzoeker');
    expect(parseHash('#/woordzoeker/spel/abc')).toBe('woordzoeker');
  });
});

describe('parsePath', () => {
  it('splits the hash into decoded segments', () => {
    expect(parsePath('')).toEqual([]);
    expect(parsePath('#/')).toEqual([]);
    expect(parsePath('#/woordzoeker/spel/a%20b?p=1')).toEqual(['woordzoeker', 'spel', 'a b']);
  });
});

describe('App shell – sub-routes', () => {
  it('keeps the Woordzoeker menu item active on sub-routes', () => {
    window.location.hash = '#/woordzoeker/mijn';
    render(<App />);
    expect(screen.getByRole('link', { name: 'Woordzoeker' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('heading', { name: 'Mijn puzzels' })).toBeInTheDocument();
  });
});
