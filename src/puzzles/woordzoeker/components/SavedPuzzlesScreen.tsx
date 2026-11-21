import { type FormEvent, useState } from 'react';

import { formatTime } from '@/shared/formatTime';

import { getTheme } from '../data/themes';
import { deletePuzzle, loadSaved, renamePuzzle, type SavedPuzzle } from '../logic/savedPuzzles';
import styles from './SavedPuzzlesScreen.module.css';

const DIFFICULTY_LABEL = { makkelijk: 'Makkelijk', normaal: 'Normaal', moeilijk: 'Moeilijk' };

interface SavedPuzzlesScreenProps {
  onOpen: (saved: SavedPuzzle) => void;
  onBack: () => void;
}

export function SavedPuzzlesScreen({ onOpen, onBack }: SavedPuzzlesScreenProps) {
  const [items, setItems] = useState(loadSaved);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () => setItems(loadSaved());

  const remove = (id: string) => {
    if (!deletePuzzle(id)) setError('Verwijderen lukte niet. Probeer het opnieuw.');
    setConfirmDelete(null);
    reload();
  };

  return (
    <div className={styles.screen}>
      <button type="button" className="btn btn-link" onClick={onBack}>
        ← Nieuwe puzzel
      </button>
      <h1 className={styles.title}>Mijn puzzels</h1>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className={styles.empty}>
          Je hebt nog geen puzzels opgeslagen. Tik tijdens het spelen op <strong>Opslaan</strong>.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={`card ${styles.item}`}>
              {renaming === item.id ? (
                <RenameForm
                  initial={item.name}
                  onCancel={() => setRenaming(null)}
                  onSave={(name) => {
                    if (!renamePuzzle(item.id, name)) setError('Hernoemen lukte niet.');
                    setRenaming(null);
                    reload();
                  }}
                />
              ) : (
                <h2 className={styles.name}>{item.name}</h2>
              )}
              <p className={styles.meta}>{describe(item)}</p>
              <p className={styles.progress}>{progressText(item)}</p>

              {confirmDelete === item.id ? (
                <div className={styles.actions} role="group" aria-label="Bevestig verwijderen">
                  <span>Weet je het zeker?</span>
                  <button type="button" className="btn btn-primary" onClick={() => remove(item.id)}>
                    Ja, verwijderen
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Nee
                  </button>
                </div>
              ) : (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onOpen(item)}
                    aria-label={`${item.name} spelen`}
                  >
                    Spelen
                  </button>
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => setRenaming(item.id)}
                    aria-label={`${item.name} hernoemen`}
                  >
                    Hernoemen
                  </button>
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => setConfirmDelete(item.id)}
                    aria-label={`${item.name} verwijderen`}
                  >
                    Verwijderen
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function describe({ puzzle, createdAt }: SavedPuzzle): string {
  const theme = puzzle.themeId ? getTheme(puzzle.themeId)?.naam : undefined;
  const date = new Date(createdAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return [
    theme ?? 'Eigen woorden',
    `${puzzle.width}×${puzzle.height}`,
    DIFFICULTY_LABEL[puzzle.difficulty],
    date,
  ].join(' · ');
}

function progressText({ puzzle, progress, bestTimeMs }: SavedPuzzle): string {
  const total = puzzle.words.length;
  const found = progress.found.length;
  if (bestTimeMs !== null && found >= total)
    return `✓ Opgelost · beste tijd ${formatTime(bestTimeMs)}`;
  const best = bestTimeMs !== null ? ` · beste tijd ${formatTime(bestTimeMs)}` : '';
  return found === 0 ? `Nog niet begonnen${best}` : `${found} / ${total} gevonden${best}`;
}

interface RenameFormProps {
  initial: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

function RenameForm({ initial, onSave, onCancel }: RenameFormProps) {
  const [name, setName] = useState(initial);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(name);
  };
  return (
    <form className={styles.rename} onSubmit={submit}>
      <label className="visually-hidden" htmlFor="ws-rename">
        Nieuwe naam
      </label>
      <input
        id="ws-rename"
        className="text-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        autoFocus
      />
      <button type="submit" className="btn btn-primary" disabled={name.trim() === ''}>
        Bewaar
      </button>
      <button type="button" className="btn btn-link" onClick={onCancel}>
        Annuleer
      </button>
    </form>
  );
}
