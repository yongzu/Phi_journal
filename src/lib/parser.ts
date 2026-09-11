import type { Course, EntryBlocks, FType } from '../types';
import { GENERAL_COURSE_ID } from '../types';

const F_TYPE_PATTERNS: Array<{ type: FType; test: (norm: string) => boolean }> = [
  { type: 'fact', test: (n) => n === 'fact' },
  { type: 'feeling', test: (n) => n === 'feeling' },
  { type: 'finding', test: (n) => n === 'finding' || n === 'findings' },
  { type: 'future', test: (n) => n === 'future item' || n === 'futureitem' || n === 'future' },
];

function normalizeTagLine(line: string): string {
  return line
    .trim()
    .replace(/^\[|\]$/g, '')
    .replace(/^#+\s*/, '')
    .replace(/[:：]\s*$/, '')
    .toLowerCase()
    .trim();
}

function matchFType(line: string): FType | null {
  const norm = normalizeTagLine(line);
  if (!norm) return null;
  for (const p of F_TYPE_PATTERNS) {
    if (p.test(norm)) return p.type;
  }
  return null;
}

function stripHeaderDecoration(line: string): string {
  return line
    .trim()
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^__|__$/g, '')
    .replace(/^#+\s*/, '')
    .replace(/[:：]\s*$/, '')
    .trim();
}

function looksLikePotentialHeader(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t.length > 20) return false;
  // sentence-like lines (contain terminal punctuation) are not headers
  if (/[.!?。]/.test(t)) return false;
  // bullet / list markers are not headers
  if (/^[-*+•]/.test(t)) return false;
  // must be a short "word-ish" line: letters/digits/korean/+/- and spaces only
  return /^[A-Za-z0-9가-힣+\-/ ]{1,20}$/.test(t);
}

function isExplicitlyBold(line: string): boolean {
  const t = line.trim();
  return /^\*\*.+\*\*$/.test(t) || /^__.+__$/.test(t);
}

// Stricter than looksLikePotentialHeader: only used to decide whether an
// UNRECOGNIZED short line should be flagged for manual review as a possible
// header, vs. treated as ordinary content. Plain Korean/mixed-case sentences
// ("원드라이브 연동") must NOT match here, or real content gets misfiled.
function looksLikeUnrecognizedHeaderCandidate(line: string): boolean {
  if (isExplicitlyBold(line)) return true;
  const t = line.trim();
  // all-caps ascii acronym style, e.g. "XYZ", "UX2" — matches how course
  // codes are actually written (BI, AOR, SI, ...)
  return /^[A-Z][A-Z0-9+\-]{0,11}$/.test(t);
}

function findCourseByHeader(header: string, courses: Course[]): Course | null {
  const norm = stripHeaderDecoration(header).toLowerCase();
  if (!norm) return null;
  for (const c of courses) {
    if (c.archived) continue;
    if (c.code.toLowerCase() === norm) return c;
    if (c.aliases.some((a) => a.toLowerCase() === norm)) return c;
    if (c.name.toLowerCase() === norm) return c;
  }
  return null;
}

export interface ParsedBucketKey {
  courseId: string; // matched course id, or '' for unmatched-header buckets
  fType: FType;
}

export interface ParsedBucket {
  courseId: string;
  fType: FType;
  text: string;
}

export interface UnclassifiedChunk {
  fType: FType | null;
  guessedHeader: string | null;
  rawText: string;
}

export interface ParseResult {
  buckets: ParsedBucket[]; // matched course + F-type content
  unclassified: UnclassifiedChunk[]; // needs manual review
}

interface OpenBuffer {
  fType: FType | null;
  courseId: string | null; // null = no header seen yet this F-section (falls back to general)
  guessedHeader: string | null; // set when this buffer belongs to an unrecognized header
  lines: string[];
}

export function parseJournalText(raw: string, courses: Course[]): ParseResult {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  const buckets: ParsedBucket[] = [];
  const unclassified: UnclassifiedChunk[] = [];

  let currentFType: FType | null = null;
  let currentCourseId: string | null = null;

  let buffer: OpenBuffer = { fType: null, courseId: null, guessedHeader: null, lines: [] };

  const flush = () => {
    let text = buffer.lines.join('\n').trim();
    if (!text && buffer.guessedHeader) {
      // the "header" line itself was never real content elsewhere — surface
      // its own text rather than silently discarding it
      text = buffer.guessedHeader;
    }
    if (!text) {
      buffer = { fType: currentFType, courseId: currentCourseId, guessedHeader: null, lines: [] };
      return;
    }
    if (buffer.guessedHeader) {
      unclassified.push({ fType: buffer.fType, guessedHeader: buffer.guessedHeader, rawText: text });
    } else if (buffer.fType === null) {
      unclassified.push({ fType: null, guessedHeader: null, rawText: text });
    } else {
      buckets.push({ courseId: buffer.courseId ?? GENERAL_COURSE_ID, fType: buffer.fType, text });
    }
    buffer = { fType: currentFType, courseId: currentCourseId, guessedHeader: null, lines: [] };
  };

  for (const rawLine of lines) {
    const fType = matchFType(rawLine);
    if (fType) {
      flush();
      currentFType = fType;
      currentCourseId = null;
      buffer.fType = currentFType;
      buffer.courseId = currentCourseId;
      continue;
    }

    if (currentFType && looksLikePotentialHeader(rawLine)) {
      const header = stripHeaderDecoration(rawLine);
      const course = findCourseByHeader(header, courses);
      if (course) {
        flush();
        currentCourseId = course.id;
        buffer.courseId = currentCourseId;
        continue;
      }
      // bold, or all-caps acronym-style line that doesn't match any known course
      // -> likely a header we failed to classify (ordinary sentences are left as content)
      if (looksLikeUnrecognizedHeaderCandidate(rawLine)) {
        flush();
        buffer.guessedHeader = header;
        buffer.fType = currentFType;
        buffer.courseId = null;
        continue;
      }
    }

    buffer.lines.push(rawLine);
  }
  flush();

  return { buckets, unclassified };
}

export function bucketsToBlocksByCourse(buckets: ParsedBucket[]): Map<string, EntryBlocks> {
  const map = new Map<string, EntryBlocks>();
  for (const b of buckets) {
    if (!map.has(b.courseId)) {
      map.set(b.courseId, { fact: '', feeling: '', finding: '', future: '' });
    }
    const blocks = map.get(b.courseId)!;
    blocks[b.fType] = blocks[b.fType] ? `${blocks[b.fType]}\n\n${b.text}` : b.text;
  }
  return map;
}
