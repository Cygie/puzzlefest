import { useCallback, useEffect, useMemo, useState } from 'react';

import { absoluteHref, getHashParam, hrefFor } from '@/app/useHashRoute';

import { PlayScreen } from './components/PlayScreen';
import { SavedPuzzlesScreen } from './components/SavedPuzzlesScreen';
import { SetupScreen } from './components/SetupScreen';
import { useProgressSaver } from './components/useProgressSaver';
import { loadSaved, recordCompletion, savePuzzle } from './logic/savedPuzzles';
import { decodePuzzle, encodePuzzle } from './logic/shareCode';
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

const INVALID_LINK = 'Deze link is ongeldig of beschadigd. Maak hieronder een nieuwe puzzel.';

/** Opens a puzzle from `#/woordzoeker?p=…` (if present) and cleans up the address. */
function viewFromLink(): { view: View; notice: string | null } | null {
  const code = getHashParam('p');
  if (code === null) return null;
  window.history.replaceState(null, '', hrefFor('woordzoeker'));
  const puzzle = decodePuzzle(code);
  if (!puzzle) return { view: { kind: 'setup' }, notice: INVALID_LINK };
  return {
    view: { kind: 'play', key: `link-${++playCounter}`, puzzle, saved: null },
    notice: null,
  };
}

export function WoordzoekerPage() {
  const [initial] = useState(viewFromLink);
  const [view, setView] = useState<View>(initial?.view ?? { kind: 'setup' });
  const [notice, setNotice] = useState<string | null>(initial?.notice ?? null);

  // A link opened while the app is already showing this page.
  useEffect(() => {
    const onHashChange = () => {
      const fromLink = viewFromLink();
      if (fromLink) {
        setView(fromLink.view);
        setNotice(fromLink.notice);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const playPuzzle = view.kind === 'play' ? view.puzzle : null;
  const shareUrl = useMemo(
    () => (playPuzzle ? absoluteHref('woordzoeker', { p: encodePuzzle(playPuzzle) }) : undefined),
    [playPuzzle],
  );
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
        notice={notice}
        savedCount={loadSaved().length}
        onShowSaved={() => setView({ kind: 'saved' })}
        onGenerated={(puzzle) => {
          setNotice(null);
          setView({ kind: 'play', key: `new-${++playCounter}`, puzzle, saved: null });
        }}
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
      shareUrl={shareUrl}
      onNew={() => setView({ kind: 'setup' })}
    />
  );
}
