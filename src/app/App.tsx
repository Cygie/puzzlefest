import { lazy, Suspense } from 'react';

import { WoordzoekerPage } from '@/puzzles/woordzoeker/WoordzoekerPage';

import styles from './App.module.css';
import { HomePage } from './HomePage';
import { hrefFor, useHashPath, useHashRoute } from './useHashRoute';

/**
 * Woordslang admin page, only in the dev server (`npm run dev`). In a production build
 * `import.meta.env.DEV` is the constant `false`, so the import and its code are dropped.
 */
const BeheerPage = import.meta.env.DEV
  ? lazy(() =>
      import('@/puzzles/woordslang/beheer/BeheerPage').then((m) => ({ default: m.BeheerPage })),
    )
  : null;

export function App() {
  const route = useHashRoute();
  const path = useHashPath();
  const showBeheer = BeheerPage !== null && path[0] === 'woordslang' && path[1] === 'beheer';

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href={hrefFor('home')}>
          PuzzleFest
        </a>
        <nav aria-label="Hoofdmenu">
          <a
            className={styles.navLink}
            href={hrefFor('woordzoeker')}
            aria-current={route === 'woordzoeker' ? 'page' : undefined}
          >
            Woordzoeker
          </a>
        </nav>
      </header>
      <main className={styles.main}>
        {showBeheer ? (
          <Suspense fallback={<p>Laden…</p>}>
            <BeheerPage />
          </Suspense>
        ) : route === 'woordzoeker' ? (
          <WoordzoekerPage />
        ) : (
          <HomePage />
        )}
      </main>
    </div>
  );
}
