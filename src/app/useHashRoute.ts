import { useEffect, useState } from 'react';

export type Route = 'home' | 'woordzoeker';

const ROUTES: Record<string, Route> = {
  '': 'home',
  '/': 'home',
  '/woordzoeker': 'woordzoeker',
};

/** Maps a location hash such as `#/woordzoeker` to a known route (unknown → home). */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').split('?')[0] ?? '';
  return ROUTES[path] ?? 'home';
}

export function hrefFor(route: Route, params?: Record<string, string>): string {
  const base = route === 'home' ? '#/' : `#/${route}`;
  const query = params ? new URLSearchParams(params).toString() : '';
  return query ? `${base}?${query}` : base;
}

/** Absolute URL for a route, e.g. for share links. */
export function absoluteHref(route: Route, params?: Record<string, string>): string {
  return new URL(hrefFor(route, params), window.location.href).toString();
}

/** Reads a query parameter from the hash, e.g. `p` from `#/woordzoeker?p=abc`. */
export function getHashParam(name: string, hash: string = window.location.hash): string | null {
  const query = hash.split('?')[1];
  return query ? new URLSearchParams(query).get(name) : null;
}

/**
 * Minimal hash-based router: works on any static host and inside the installed PWA
 * without server-side rewrites.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
