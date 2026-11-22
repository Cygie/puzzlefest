import { lazy, Suspense } from 'react';

import { GetallenpadPage } from '@/puzzles/getallenpad/GetallenpadPage';
import { WoordslangPage } from '@/puzzles/woordslang/WoordslangPage';
import { WoordzoekerPage } from '@/puzzles/woordzoeker/WoordzoekerPage';

import styles from './App.module.css';
import { HomePage } from './HomePage';
import { hrefFor, useHashPath, useHashRoute } from './useHashRoute';

/**
 * Admin pages, only in the dev server (`npm run dev`), at `#/<puzzle>/beheer`. In a production
 * build `import.meta.env.DEV` is the constant `false`, so the imports and their code are dropped.
 */
const BEHEER_PAGES = import.meta.env.DEV
  ? {
      woordslang: lazy(() =>
        import('@/puzzles/woordslang/beheer/BeheerPage').then((m) => ({ default: m.BeheerPage })),
      ),
      getallenpad: lazy(() =>
        import('@/puzzles/getallenpad/beheer/BeheerPage').then((m) => ({ default: m.BeheerPage })),
      ),
    }
  : null;

export function App() {
  const route = useHashRoute();
  const path = useHashPath();
  const BeheerPage =
    path[1] === 'beheer' && BEHEER_PAGES && (path[0] === 'woordslang' || path[0] === 'getallenpad')
      ? BEHEER_PAGES[path[0]]
      : null;

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
          <a
            className={styles.navLink}
            href={hrefFor('woordslang')}
            aria-current={route === 'woordslang' ? 'page' : undefined}
          >
            Woordslang
          </a>
          <a
            className={styles.navLink}
            href={hrefFor('getallenpad')}
            aria-current={route === 'getallenpad' ? 'page' : undefined}
          >
            Getallenpad
          </a>
        </nav>
      </header>
      <main className={styles.main}>
        {BeheerPage ? (
          <Suspense fallback={<p>Laden…</p>}>
            <BeheerPage />
          </Suspense>
        ) : route === 'woordzoeker' ? (
          <WoordzoekerPage />
        ) : route === 'woordslang' ? (
          <WoordslangPage />
        ) : route === 'getallenpad' ? (
          <GetallenpadPage />
        ) : (
          <HomePage />
        )}
      </main>
    </div>
  );
}
