import { describe, expect, it } from 'vitest';

import { formatPuzzleJson } from '../beheer/formatPuzzleJson';
import { createPuzzle } from '../logic/createPuzzle';
import { LEVELS } from '../logic/types';

/** First seed per level; three puzzles each. */
const FIRST_SEED = { makkelijk: 101, normaal: 201, moeilijk: 301 } as const;

/**
 * Writes the starter puzzles into this folder (normally use the admin page instead):
 * `GENERATE=1 npx vitest run src/puzzles/getallenpad/data/generate -u`.
 */
describe.skipIf(!import.meta.env.GENERATE)('generate starter puzzles', () => {
  it.each(LEVELS)('%s', { timeout: 120_000 }, async (level) => {
    for (let seed = FIRST_SEED[level]; seed < FIRST_SEED[level] + 3; seed++) {
      const result = createPuzzle({ width: 7, height: 7, level, seed }, { timeoutMs: Infinity });
      if (!result.ok) throw new Error(result.error.message);
      await expect(formatPuzzleJson(result.value)).toMatchFileSnapshot(`./${result.value.id}.json`);
    }
  });
});
