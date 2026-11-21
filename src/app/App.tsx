import { WoordzoekerPage } from '@/puzzles/woordzoeker/WoordzoekerPage';

import styles from './App.module.css';
import { HomePage } from './HomePage';
import { hrefFor, useHashRoute } from './useHashRoute';

export function App() {
  const route = useHashRoute();

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
        {route === 'woordzoeker' ? <WoordzoekerPage /> : <HomePage />}
      </main>
    </div>
  );
}
