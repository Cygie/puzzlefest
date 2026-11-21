import { useCallback, useState } from 'react';

import { PlayScreen } from './components/PlayScreen';
import { SavedPuzzlesScreen } from './components/SavedPuzzlesScreen';
import { SetupScreen } from './components/SetupScreen';
import { useProgressSaver } from './components/useProgressSaver';
import { loadSaved, recordCompletion, savePuzzle } from './logic/savedPuzzles';
import type { PlayProgress, Puzzle } from './logic/types';

type View =
  | { kind: 'setup' }
  | { kind: 'saved' }
  | {
      kind: 'play';
      /** Remount key: a different puzzle gets a fresh PlayScreen. */
      key: string;
      puzzle: Puzzle;
      saved: { id: string; bestTimeMs: number | null } | null;
      initialProgress?: PlayProgress;
    };

let playCounter = 0;

export function WoordzoekerPage() {
  const [view, setView] = useState<View>({ kind: 'setup' });
  const savedId = view.kind === 'play' ? (view.saved?.id ?? null) : null;
  const { onProgress, flush } = useProgressSaver(savedId);

  const onComplete = useCallback(
    (timeMs: number) => {
      if (!savedId) return null;
      flush();
      const result = recordCompletion(savedId, timeMs);
      if (result) {
        setView((v) =>
          v.kind === 'play' && v.saved
            ? { ...v, saved: { ...v.saved, bestTimeMs: result.bestTimeMs } }
            : v,
        );
      }
      return result;
    },
    [savedId, flush],
  );

  if (view.kind === 'saved') {
    return (
      <SavedPuzzlesScreen
        onBack={() => setView({ kind: 'setup' })}
        onOpen={(item) =>
          setView({
            kind: 'play',
            key: item.id,
            puzzle: item.puzzle,
            saved: { id: item.id, bestTimeMs: item.bestTimeMs },
            initialProgress: item.progress,
          })
        }
      />
    );
  }

  if (view.kind === 'setup') {
    return (
      <SetupScreen
        savedCount={loadSaved().length}
        onShowSaved={() => setView({ kind: 'saved' })}
        onGenerated={(puzzle) =>
          setView({ kind: 'play', key: `new-${++playCounter}`, puzzle, saved: null })
        }
      />
    );
  }

  return (
    <PlayScreen
      key={view.key}
      puzzle={view.puzzle}
      initialProgress={view.initialProgress}
      saved={view.saved}
      onProgress={onProgress}
      onSave={(progress) => {
        const result = savePuzzle(view.puzzle, progress);
        if (result.ok) {
          setView({ ...view, saved: { id: result.saved.id, bestTimeMs: null } });
        }
        return result;
      }}
      onComplete={onComplete}
      onNew={() => setView({ kind: 'setup' })}
    />
  );
}
