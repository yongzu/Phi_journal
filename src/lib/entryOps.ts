import type { DailyCourseEntry, EntryBlocks, FType, UnclassifiedItem } from '../types';
import type { ParsedBucket, UnclassifiedChunk } from './parser';
import { newId } from './id';

function emptyBlocks(): EntryBlocks {
  return { fact: '', feeling: '', finding: '', future: '' };
}

function mergeText(existing: string, incoming: string): string {
  if (!existing) return incoming;
  if (!incoming) return existing;
  return `${existing}\n\n---\n\n${incoming}`;
}

export function upsertBucketsIntoEntries(
  entries: DailyCourseEntry[],
  date: string,
  buckets: ParsedBucket[],
): DailyCourseEntry[] {
  const next = [...entries];
  for (const bucket of buckets) {
    const idx = next.findIndex((e) => e.date === date && e.courseId === bucket.courseId);
    if (idx === -1) {
      const blocks = emptyBlocks();
      blocks[bucket.fType] = bucket.text;
      next.push({
        id: newId(),
        date,
        courseId: bucket.courseId,
        blocks,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const entry = next[idx];
      const blocks = { ...entry.blocks };
      blocks[bucket.fType] = mergeText(blocks[bucket.fType], bucket.text);
      next[idx] = { ...entry, blocks, updatedAt: new Date().toISOString() };
    }
  }
  return next;
}

export function appendTextToEntry(
  entries: DailyCourseEntry[],
  date: string,
  courseId: string,
  fType: FType,
  text: string,
): DailyCourseEntry[] {
  const next = [...entries];
  const idx = next.findIndex((e) => e.date === date && e.courseId === courseId);
  if (idx === -1) {
    const blocks = emptyBlocks();
    blocks[fType] = text;
    next.push({ id: newId(), date, courseId, blocks, updatedAt: new Date().toISOString() });
  } else {
    const entry = next[idx];
    const blocks = { ...entry.blocks };
    blocks[fType] = mergeText(blocks[fType], text);
    next[idx] = { ...entry, blocks, updatedAt: new Date().toISOString() };
  }
  return next;
}

export function chunksToUnclassifiedItems(date: string, chunks: UnclassifiedChunk[]): UnclassifiedItem[] {
  return chunks.map((c) => ({
    id: newId(),
    date,
    fType: c.fType,
    guessedHeader: c.guessedHeader,
    rawText: c.rawText,
    createdAt: new Date().toISOString(),
    resolved: false,
  }));
}
