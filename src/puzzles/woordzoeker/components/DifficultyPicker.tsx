import type { Difficulty } from '../logic/types';
import styles from './SetupScreen.module.css';

const OPTIONS: { value: Difficulty; label: string; uitleg: string }[] = [
  {
    value: 'makkelijk',
    label: 'Makkelijk',
    uitleg: 'Woorden staan van links naar rechts en van boven naar beneden.',
  },
  { value: 'normaal', label: 'Normaal', uitleg: 'Woorden kunnen ook schuin staan.' },
  {
    value: 'moeilijk',
    label: 'Moeilijk',
    uitleg: 'Woorden kunnen in alle richtingen staan, ook achterstevoren.',
  },
];

interface DifficultyPickerProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  const current = OPTIONS.find((o) => o.value === value);
  return (
    <div>
      <div className={styles.segmented} role="radiogroup" aria-label="Moeilijkheid">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={styles.segment}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className={styles.hint}>{current?.uitleg}</p>
    </div>
  );
}
