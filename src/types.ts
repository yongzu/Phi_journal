export interface Course {
  id: string;
  code: string;
  name: string;
  aliases: string[];
  archived?: boolean;
}

export type FType = 'fact' | 'feeling' | 'finding' | 'future';

export const F_TYPE_LABELS: Record<FType, string> = {
  fact: 'Fact (사실)',
  feeling: 'Feeling (느낌)',
  finding: 'Finding (통찰)',
  future: 'Future Item (액션아이템)',
};

export const F_TYPE_ORDER: FType[] = ['fact', 'feeling', 'finding', 'future'];

export interface EntryBlocks {
  fact: string;
  feeling: string;
  finding: string;
  future: string;
}

export interface DailyCourseEntry {
  id: string;
  date: string;
  courseId: string;
  blocks: EntryBlocks;
  updatedAt: string;
}

export interface UnclassifiedItem {
  id: string;
  date: string;
  fType: FType | null;
  guessedHeader: string | null;
  rawText: string;
  createdAt: string;
  resolved: boolean;
}

export interface RawJournalLog {
  id: string;
  date: string;
  rawText: string;
  createdAt: string;
}

export const GENERAL_COURSE_ID = 'general';
