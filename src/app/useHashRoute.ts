import { useEffect, useState } from 'react';

export type Route = 'home' | 'woordzoeker' | 'woordslang';

/** Top-level routes by first path segment; sub-paths belong to the same page. */
const ROUTES: Record<string, Route> = {
  '': 'home',
  woordzoeker: 'woordzoeker',
  woordslang: 'woordslang',
};

/** Path segments of a hash, e.g. `#/woordzoeker/spel/abc?p=1` → `['woordzoeker','spel','abc']`. */
export function parsePath(hash: string): string[] {
  const path = hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

/** Maps a location hash such as `#/woordzoeker/mijn` to its top-level route (unknown → home). */
export function parseHash(hash: string): Route {
  return ROUTES[parsePath(hash)[0] ?? ''] ?? 'home';
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
 * Goes to a hash. By default this adds a history entry (so the back button returns);
 * with `replace` the current entry is replaced instead.
 */
export function navigate(hash: string, { replace = false }: { replace?: boolean } = {}): void {
  if (replace) {
    window.history.replaceState(window.history.state, '', hash);
    // replaceState does not fire hashchange; notify listeners ourselves.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

function useHashValue<T>(read: (hash: string) => T, key: (value: T) => string): T {
  const [value, setValue] = useState<T>(() => read(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      const next = read(window.location.hash);
      setValue((current) => (key(current) === key(next) ? current : next));
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [read, key]);

  return value;
}

const identity = (route: Route) => route;
const joinPath = (path: string[]) => path.join('/');

/**
 * Minimal hash-based router: works on any static host and inside the installed PWA
 * without server-side rewrites.
 */
export function useHashRoute(): Route {
  return useHashValue(parseHash, identity);
}

/** Current hash path segments; updates on navigation (incl. the back button). */
export function useHashPath(): string[] {
  return useHashValue(parsePath, joinPath);
}
