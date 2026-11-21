import styles from './HomePage.module.css';
import { hrefFor } from './useHashRoute';

export function HomePage() {
  return (
    <section>
      <h1 className={styles.title}>Welkom bij PuzzleFest</h1>
      <p className={styles.intro}>Kies een puzzel om te beginnen.</p>
      <ul className={styles.tiles}>
        <li>
          <a className={styles.tile} href={hrefFor('woordzoeker')}>
            <span className={styles.tileTitle}>Woordzoeker</span>
            <span className={styles.tileText}>
              Maak een woordzoeker op basis van een thema of je eigen woorden.
            </span>
          </a>
        </li>
      </ul>
    </section>
  );
}
