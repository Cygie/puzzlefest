import { useEffect, useState } from 'react';

import { navigate, useHashPath } from '@/app/useHashRoute';

import { PadPlayScreen } from './components/PadPlayScreen';
import { PuzzleListScreen } from './components/PuzzleListScreen';
import { findPuzzle, publishedPuzzles } from './data';

/**
 *   #/getallenpad        list of published puzzles, by level
 *   #/getallenpad/<id>   play a puzzle
 * (`#/getallenpad/beheer` is the dev-only admin page, handled by the app shell.)
 */
export const ROUTE_LIST = '#/getallenpad';
export const routePuzzle = (id: string) => `${ROUTE_LIST}/${encodeURIComponent(id)}`;

const MISSING = 'Deze puzzel bestaat niet (meer). Kies hieronder een andere.';

export function GetallenpadPage() {
  const path = useHashPath();
  const [notice, setNotice] = useState<string | null>(null);
  const id = path[1] ?? null;
  const puzzle = id ? findPuzzle(id) : undefined;
  const missing = id !== null && !puzzle;

  useEffect(() => {
    if (!missing) return;
    setNotice(MISSING);
    navigate(ROUTE_LIST, { replace: true });
  }, [missing]);

  if (missing) return null;

  if (puzzle) {
    return <PadPlayScreen key={puzzle.id} puzzle={puzzle} onBack={() => navigate(ROUTE_LIST)} />;
  }

  return (
    <PuzzleListScreen
      puzzles={publishedPuzzles()}
      notice={notice}
      onOpen={(p) => {
        setNotice(null);
        navigate(routePuzzle(p.id));
      }}
    />
  );
}
