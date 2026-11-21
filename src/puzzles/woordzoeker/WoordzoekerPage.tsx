import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { absoluteHref, getHashParam, navigate, useHashPath } from '@/app/useHashRoute';

import { PlayScreen } from './components/PlayScreen';
import { SavedPuzzlesScreen } from './components/SavedPuzzlesScreen';
import { SetupScreen } from './components/SetupScreen';
import { useProgressSaver } from './components/useProgressSaver';
import { loadSaved, recordCompletion, savePuzzle } from './logic/savedPuzzles';
import { decodePuzzle, encodePuzzle } from './logic/shareCode';
import type { PlayProgress, Puzzle } from './logic/types';

/**
 * Screens have their own hash routes so the browser history (Android back button)
 * moves between them:
 *   #/woordzoeker            setup
 *   #/woordzoeker/mijn       Mijn puzzels
 *   #/woordzoeker/spel       unsaved puzzle (kept in memory)
 *   #/woordzoeker/spel/<id>  saved puzzle (loaded from storage, survives reload)
 */
export const ROUTE_SETUP = '#/woordzoeker';
export const ROUTE_SAVED = '#/woordzoeker/mijn';
export const ROUTE_PLAY = '#/woordzoeker/spel';
export const routeSaved = (id: string) => `${ROUTE_PLAY}/${encodeURIComponent(id)}`;

const INVALID_LINK = 'Deze link is ongeldig of beschadigd. Maak hieronder een nieuwe puzzel.';
const MISSING_SAVED = 'Deze puzzel is niet (meer) opgeslagen op dit apparaat.';

/** The puzzle being played that is not (or only just) saved. */
interface Memory {
  /** Remount key: a different puzzle gets a fresh PlayScreen. */
  key: string;
  puzzle: Puzzle;
  savedId: string | null;
}

let playCounter = 0;

interface LinkResult {
  memory: Memory | null;
  notice: string | null;
}

/**
 * Handles a share link (`#/woordzoeker?p=…`): decodes it and replaces the address with
 * the play route (or setup when invalid). Returns null when there is no link.
 */
function takeShareLink(): LinkResult | null {
  const code = getHashParam('p');
  if (code === null) return null;
  const puzzle = decodePuzzle(code);
  const target = puzzle ? ROUTE_PLAY : ROUTE_SETUP;
  window.history.replaceState(window.history.state, '', target);
  return puzzle
    ? { memory: { key: `link-${++playCounter}`, puzzle, savedId: null }, notice: null }
    : { memory: null, notice: INVALID_LINK };
}

export function WoordzoekerPage() {
  // Must run before useHashPath reads the address.
  const [initialLink] = useState(takeShareLink);
  const [memory, setMemory] = useState<Memory | null>(initialLink?.memory ?? null);
  const [notice, setNotice] = useState<string | null>(initialLink?.notice ?? null);
  const [bestTimes, setBestTimes] = useState<Record<string, number>>({});
  // Progress of unsaved puzzles, so back → forward resumes instead of restarting.
  const memoryProgress = useRef<Record<string, PlayProgress>>({});
  const path = useHashPath();

  // A share link opened while this page is already showing.
  useEffect(() => {
    const onHashChange = () => {
      const link = takeShareLink();
      if (!link) return;
      if (link.memory) setMemory(link.memory);
      setNotice(link.notice);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const screen = path[1];
  const routeId = screen === 'spel' ? (path[2] ?? null) : null;

  // Saved puzzle for /spel/<id>: a snapshot is enough, it only seeds the play screen.
  const savedItem = useMemo(
    () => (routeId ? (loadSaved().find((item) => item.id === routeId) ?? null) : null),
    [routeId],
  );

  let play: { key: string; puzzle: Puzzle; savedId: string | null } | null = null;
  if (screen === 'spel') {
    if (routeId && memory?.savedId === routeId) play = memory;
    else if (routeId && savedItem)
      play = { key: savedItem.id, puzzle: savedItem.puzzle, savedId: savedItem.id };
    else if (!routeId && memory) play = memory;
  }
  const redirect = screen === 'spel' && !play ? (routeId ? ROUTE_SAVED : ROUTE_SETUP) : null;

  useEffect(() => {
    if (!redirect) return;
    if (redirect === ROUTE_SAVED) setNotice(MISSING_SAVED);
    navigate(redirect, { replace: true });
  }, [redirect]);

  const savedId = play?.savedId ?? null;
  const { onProgress: saveProgress, flush } = useProgressSaver(savedId);
  const playKey = play?.key ?? null;
  const onProgress = useCallback(
    (progress: PlayProgress) => {
      if (playKey) memoryProgress.current[playKey] = progress;
      saveProgress(progress);
    },
    [playKey, saveProgress],
  );

  const playPuzzle = play?.puzzle ?? null;
  const shareUrl = useMemo(
    () => (playPuzzle ? absoluteHref('woordzoeker', { p: encodePuzzle(playPuzzle) }) : undefined),
    [playPuzzle],
  );

  const onComplete = useCallback(
    (timeMs: number) => {
      if (!savedId) return null;
      flush();
      const result = recordCompletion(savedId, timeMs);
      if (result) setBestTimes((times) => ({ ...times, [savedId]: result.bestTimeMs }));
      return result;
    },
    [savedId, flush],
  );

  if (redirect) return null;

  if (screen === 'mijn') {
    return (
      <SavedPuzzlesScreen
        notice={notice}
        onBack={() => navigate(ROUTE_SETUP)}
        onOpen={(item) => {
          setNotice(null);
          navigate(routeSaved(item.id));
        }}
      />
    );
  }

  if (play) {
    const bestTimeMs =
      savedId === null ? null : (bestTimes[savedId] ?? savedItem?.bestTimeMs ?? null);
    return (
      <PlayScreen
        key={play.key}
        puzzle={play.puzzle}
        initialProgress={
          savedItem && savedItem.id === savedId
            ? savedItem.progress
            : memoryProgress.current[play.key]
        }
        saved={savedId ? { id: savedId, bestTimeMs } : null}
        onProgress={onProgress}
        onSave={(progress) => {
          const current = play;
          const result = savePuzzle(current.puzzle, progress);
          if (result.ok) {
            setMemory({ key: current.key, puzzle: current.puzzle, savedId: result.saved.id });
            // Same game, now saved: replace the address without a new history entry.
            navigate(routeSaved(result.saved.id), { replace: true });
          }
          return result;
        }}
        onComplete={onComplete}
        shareUrl={shareUrl}
        onNew={() => navigate(ROUTE_SETUP)}
      />
    );
  }

  return (
    <SetupScreen
      notice={notice}
      savedCount={loadSaved().length}
      onShowSaved={() => {
        setNotice(null);
        navigate(ROUTE_SAVED);
      }}
      onGenerated={(puzzle) => {
        setNotice(null);
        setMemory({ key: `new-${++playCounter}`, puzzle, savedId: null });
        navigate(ROUTE_PLAY);
      }}
    />
  );
}
