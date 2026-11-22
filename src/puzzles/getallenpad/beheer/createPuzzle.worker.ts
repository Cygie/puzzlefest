/// <reference lib="webworker" />
import { makeItem, type WorkerMessage, type WorkerRequest } from './puzzleFactory';

/** Makes the puzzles of one batch and posts each as soon as it is ready. */
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { seeds, ...request } = event.data;
  const post = (message: WorkerMessage) => self.postMessage(message);
  for (const seed of seeds) post({ type: 'puzzle', item: makeItem(request, seed) });
  post({ type: 'done' });
};
