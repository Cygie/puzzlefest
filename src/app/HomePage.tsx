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
        <li>
          <a className={styles.tile} href={hrefFor('woordslang')}>
            <span className={styles.tileTitle}>Woordslang</span>
            <span className={styles.tileText}>
              Raad het thema en vind de woorden die door het raster slingeren.
            </span>
          </a>
        </li>
        <li>
          <a className={styles.tile} href={hrefFor('getallenpad')}>
            <span className={styles.tileTitle}>Getallenpad</span>
            <span className={styles.tileText}>
              Leg een pad van 1 tot het eind door alle vakjes, met getallen die elkaar raken.
            </span>
          </a>
        </li>
      </ul>
    </section>
  );
}
