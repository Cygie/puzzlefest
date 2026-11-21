import { useState } from 'react';

import { PlayScreen } from './components/PlayScreen';
import { SetupScreen } from './components/SetupScreen';
import type { Puzzle } from './logic/types';

export function WoordzoekerPage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  if (!puzzle) return <SetupScreen onGenerated={setPuzzle} />;
  return <PlayScreen puzzle={puzzle} onNew={() => setPuzzle(null)} />;
}
