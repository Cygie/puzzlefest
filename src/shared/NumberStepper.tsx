import styles from './NumberStepper.module.css';

interface NumberStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** Touch-friendly − value + control. */
export function NumberStepper({ label, value, min, max, onChange }: NumberStepperProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`${label} verlagen`}
        >
          −
        </button>
        <output className={styles.value} aria-live="polite">
          {value}
        </output>
        <button
          type="button"
          className={styles.button}
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`${label} verhogen`}
        >
          +
        </button>
      </div>
    </div>
  );
}
