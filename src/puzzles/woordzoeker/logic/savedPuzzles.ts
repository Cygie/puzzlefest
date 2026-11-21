import { readStored, writeStored } from '@/shared/storage';

import { getTheme } from '../data/themes';
import type { PlayProgress, Puzzle } from './types';
import { isPlayProgress, isPuzzle } from './validatePuzzle';

export interface SavedPuzzle {
  id: string;
  name: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  puzzle: Puzzle;
  progress: PlayProgress;
  bestTimeMs: number | null;
}

export const SAVED_KEY = 'woordzoeker:saved';
export const SAVED_VERSION = 1;
export const MAX_SAVED = 50;

const STORAGE_FAILED =
  'Opslaan lukte niet: de opslag op dit apparaat is vol of geblokkeerd. Verwijder oude puzzels en probeer het opnieuw.';

export type SaveResult = { ok: true; saved: SavedPuzzle } | { ok: false; reason: string };

function isSavedPuzzle(value: unknown): value is SavedPuzzle {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string' &&
    (v.bestTimeMs === null || (typeof v.bestTimeMs === 'number' && v.bestTimeMs >= 0)) &&
    isPuzzle(v.puzzle) &&
    isPlayProgress(v.progress, v.puzzle)
  );
}

const isList = (value: unknown): value is unknown[] => Array.isArray(value);

/** All saved puzzles, newest first. Invalid entries are skipped. */
export function loadSaved(): SavedPuzzle[] {
  return (readStored(SAVED_KEY, SAVED_VERSION, isList) ?? []).filter(isSavedPuzzle);
}

function persist(list: SavedPuzzle[]): boolean {
  return writeStored(SAVED_KEY, SAVED_VERSION, list);
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** e.g. "Dieren · 21 nov" or "Eigen woorden · 21 nov". */
export function defaultName(puzzle: Puzzle, now: Date = new Date()): string {
  const theme = puzzle.themeId ? getTheme(puzzle.themeId)?.naam : undefined;
  const date = now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '');
  return `${theme ?? 'Eigen woorden'} · ${date}`;
}

export function savePuzzle(
  puzzle: Puzzle,
  progress: PlayProgress,
  now: Date = new Date(),
): SaveResult {
  const list = loadSaved();
  if (list.length >= MAX_SAVED) {
    return {
      ok: false,
      reason: `Je hebt al ${MAX_SAVED} puzzels opgeslagen. Verwijder er eerst een in Mijn puzzels.`,
    };
  }
  const iso = now.toISOString();
  const saved: SavedPuzzle = {
    id: newId(),
    name: defaultName(puzzle, now),
    createdAt: iso,
    updatedAt: iso,
    puzzle,
    progress,
    bestTimeMs: null,
  };
  return persist([saved, ...list]) ? { ok: true, saved } : { ok: false, reason: STORAGE_FAILED };
}

function updateOne(id: string, change: (item: SavedPuzzle) => SavedPuzzle): SavedPuzzle | null {
  const list = loadSaved();
  const index = list.findIndex((item) => item.id === id);
  const current = list[index];
  if (!current) return null;
  const next = change(current);
  list[index] = next;
  return persist(list) ? next : null;
}

export function updateProgress(
  id: string,
  progress: PlayProgress,
  now: Date = new Date(),
): boolean {
  return updateOne(id, (item) => ({ ...item, progress, updatedAt: now.toISOString() })) !== null;
}

/** Stores a finished time; returns the best time and whether this was a new record. */
export function recordCompletion(
  id: string,
  timeMs: number,
): { bestTimeMs: number; isRecord: boolean } | null {
  let isRecord = false;
  const updated = updateOne(id, (item) => {
    isRecord = item.bestTimeMs === null || timeMs < item.bestTimeMs;
    return isRecord ? { ...item, bestTimeMs: timeMs } : item;
  });
  return updated && updated.bestTimeMs !== null
    ? { bestTimeMs: updated.bestTimeMs, isRecord }
    : null;
}

export function renamePuzzle(id: string, name: string): boolean {
  const trimmed = name.trim();
  if (trimmed === '') return false;
  return updateOne(id, (item) => ({ ...item, name: trimmed.slice(0, 60) })) !== null;
}

export function deletePuzzle(id: string): boolean {
  const list = loadSaved();
  const next = list.filter((item) => item.id !== id);
  return next.length !== list.length && persist(next);
}
