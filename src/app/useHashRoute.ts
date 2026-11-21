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

export function hrefFor(route: Route): string {
  return route === 'home' ? '#/' : `#/${route}`;
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
