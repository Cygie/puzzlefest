import { useState } from 'react';

import { GridPreview } from './components/GridPreview';
import { SetupScreen } from './components/SetupScreen';
import type { Puzzle } from './logic/types';

export function WoordzoekerPage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  if (!puzzle) return <SetupScreen onGenerated={setPuzzle} />;

  return (
    <section>
      <h1>Woordzoeker</h1>
      <GridPreview puzzle={puzzle} />
      <p>
        <button type="button" className="btn btn-secondary" onClick={() => setPuzzle(null)}>
          Nieuwe puzzel
        </button>
      </p>
    </section>
  );
}
