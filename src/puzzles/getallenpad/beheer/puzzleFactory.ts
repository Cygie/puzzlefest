import { randomSeed } from '@/shared/random';
import type { Result } from '@/shared/result';

import { type CreateError, createPuzzle } from '../logic/createPuzzle';
import type { GetallenpadPuzzle, Level } from '../logic/types';

export const MAX_BATCH = 20;

export interface BatchRequest {
  width: number;
  height: number;
  level: Level;
  /** First seed; `null` picks a random seed per puzzle. */
  seed: number | null;
  count: number;
}

export interface BatchItem {
  seed: number;
  result: Result<GetallenpadPuzzle, CreateError>;
}

export interface BatchHandlers {
  onPuzzle: (item: BatchItem) => void;
  onDone: () => void;
}

/** Makes a batch of puzzles in the background; `start` returns a function that cancels it. */
export interface PuzzleFactory {
  start: (request: BatchRequest, handlers: BatchHandlers) => () => void;
}

/** Message from the page to the worker. */
export interface WorkerRequest {
  width: number;
  height: number;
  level: Level;
  seeds: number[];
}

/** Messages from the worker to the page. */
export type WorkerMessage = { type: 'puzzle'; item: BatchItem } | { type: 'done' };

/** Seeds for a batch: a given seed counts up (seed, seed + 1, …), otherwise random seeds. */
export function batchSeeds(
  { seed, count }: Pick<BatchRequest, 'seed' | 'count'>,
  random: () => number = randomSeed,
): number[] {
  return Array.from({ length: count }, (_, i) => (seed === null ? random() : (seed + i) >>> 0));
}

/** Makes one puzzle of a batch (shared by the worker and the in-process factory). */
export function makeItem(request: Omit<WorkerRequest, 'seeds'>, seed: number): BatchItem {
  const { width, height, level } = request;
  return { seed, result: createPuzzle({ width, height, level, seed }) };
}

/**
 * Runs the batch on the main thread, one puzzle per task, so it can be cancelled between
 * puzzles. Used in tests (jsdom has no Worker) and as a fallback.
 */
export const inProcessFactory: PuzzleFactory = {
  start(request, { onPuzzle, onDone }) {
    const seeds = batchSeeds(request);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const next = (index: number) => {
      timer = setTimeout(() => {
        if (index >= seeds.length) {
          timer = null;
          onDone();
          return;
        }
        onPuzzle(makeItem(request, seeds[index]!));
        next(index + 1);
      }, 0);
    };
    next(0);
    return () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
  },
};

/**
 * Runs the batch in a Web Worker so the page stays responsive. The worker is busy in a
 * synchronous loop and cannot read a cancel message, so cancelling terminates it.
 */
export const workerFactory: PuzzleFactory = {
  start(request, { onPuzzle, onDone }) {
    const worker = new Worker(new URL('./createPuzzle.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data.type === 'puzzle') {
        onPuzzle(event.data.item);
      } else {
        worker.terminate();
        onDone();
      }
    };
    const message: WorkerRequest = {
      width: request.width,
      height: request.height,
      level: request.level,
      seeds: batchSeeds(request),
    };
    worker.postMessage(message);
    return () => worker.terminate();
  },
};
