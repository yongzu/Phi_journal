import type { Course, DailyCourseEntry, RawJournalLog, UnclassifiedItem } from '../types';
import { DEFAULT_COURSES } from './defaultCourses';

const KEYS = {
  courses: 'phi-journal:courses',
  entries: 'phi-journal:entries',
  unclassified: 'phi-journal:unclassified',
  rawLogs: 'phi-journal:rawlogs',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadCourses(): Course[] {
  const stored = read<Course[] | null>(KEYS.courses, null);
  if (!stored || stored.length === 0) {
    write(KEYS.courses, DEFAULT_COURSES);
    return DEFAULT_COURSES;
  }
  return stored;
}

export function saveCourses(courses: Course[]): void {
  write(KEYS.courses, courses);
}

export function loadEntries(): DailyCourseEntry[] {
  return read<DailyCourseEntry[]>(KEYS.entries, []);
}

export function saveEntries(entries: DailyCourseEntry[]): void {
  write(KEYS.entries, entries);
}

export function loadUnclassified(): UnclassifiedItem[] {
  return read<UnclassifiedItem[]>(KEYS.unclassified, []);
}

export function saveUnclassified(items: UnclassifiedItem[]): void {
  write(KEYS.unclassified, items);
}

export function loadRawLogs(): RawJournalLog[] {
  return read<RawJournalLog[]>(KEYS.rawLogs, []);
}

export function saveRawLogs(logs: RawJournalLog[]): void {
  write(KEYS.rawLogs, logs);
}

export interface ExportedData {
  version: 1;
  exportedAt: string;
  courses: Course[];
  entries: DailyCourseEntry[];
  unclassified: UnclassifiedItem[];
  rawLogs: RawJournalLog[];
}

export function exportAllData(): ExportedData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    courses: loadCourses(),
    entries: loadEntries(),
    unclassified: loadUnclassified(),
    rawLogs: loadRawLogs(),
  };
}

export function importAllData(data: ExportedData): void {
  if (data.courses) saveCourses(data.courses);
  if (data.entries) saveEntries(data.entries);
  if (data.unclassified) saveUnclassified(data.unclassified);
  if (data.rawLogs) saveRawLogs(data.rawLogs);
}
