import { THEMES } from '../data/themes';
import styles from './SetupScreen.module.css';

interface ThemePickerProps {
  themeId: string | null;
  onSelect: (themeId: string | null) => void;
}

export function ThemePicker({ themeId, onSelect }: ThemePickerProps) {
  return (
    <div className={styles.chips} role="radiogroup" aria-label="Thema">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={theme.id === themeId}
          className={styles.choice}
          onClick={() => onSelect(theme.id)}
        >
          {theme.naam}
        </button>
      ))}
      <button
        type="button"
        role="radio"
        aria-checked={themeId === null}
        className={styles.choice}
        onClick={() => onSelect(null)}
      >
        Eigen woorden
      </button>
    </div>
  );
}
