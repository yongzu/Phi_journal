import { useMemo, useState } from 'react';
import type { Course, DailyCourseEntry, RawJournalLog, UnclassifiedItem } from '../types';
import { F_TYPE_LABELS, F_TYPE_ORDER } from '../types';
import { parseJournalText, bucketsToBlocksByCourse } from '../lib/parser';
import { upsertBucketsIntoEntries, chunksToUnclassifiedItems } from '../lib/entryOps';
import { newId } from '../lib/id';

interface Props {
  courses: Course[];
  entries: DailyCourseEntry[];
  setEntries: (fn: (prev: DailyCourseEntry[]) => DailyCourseEntry[]) => void;
  unclassified: UnclassifiedItem[];
  setUnclassified: (fn: (prev: UnclassifiedItem[]) => UnclassifiedItem[]) => void;
  rawLogs: RawJournalLog[];
  setRawLogs: (fn: (prev: RawJournalLog[]) => RawJournalLog[]) => void;
}

function todayStr(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function courseName(courses: Course[], id: string): string {
  return courses.find((c) => c.id === id)?.name ?? id;
}

export default function InputPage({
  courses,
  setEntries,
  setUnclassified,
  setRawLogs,
}: Props) {
  const [date, setDate] = useState(todayStr());
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseJournalText> | null>(null);
  const [saved, setSaved] = useState(false);

  const byCourse = useMemo(() => (parsed ? bucketsToBlocksByCourse(parsed.buckets) : null), [parsed]);

  function handleParse() {
    const result = parseJournalText(text, courses);
    setParsed(result);
    setSaved(false);
  }

  function handleSave() {
    if (!parsed) return;
    setEntries((prev) => upsertBucketsIntoEntries(prev, date, parsed.buckets));
    if (parsed.unclassified.length > 0) {
      setUnclassified((prev) => [...prev, ...chunksToUnclassifiedItems(date, parsed.unclassified)]);
    }
    setRawLogs((prev) => [...prev, { id: newId(), date, rawText: text, createdAt: new Date().toISOString() }]);
    setSaved(true);
  }

  return (
    <div className="page">
      <h2>오늘의 저널 붙여넣기</h2>
      <p className="hint">
        기존처럼 [fact] / [feeling] / [findings] / [Future item] 섹션 안에 과목명(예: BI, AOR, SI)을 소제목으로 넣어
        통합 텍스트로 작성한 뒤 붙여넣으세요. 과목으로 인식되지 않는 부분은 자동으로 "미분류" 목록에 모입니다.
      </p>

      <div className="field">
        <label>날짜</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="field">
        <label>저널 원문</label>
        <textarea
          rows={18}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setParsed(null);
            setSaved(false);
          }}
          placeholder={'[fact]\nBI\n오늘 배운 내용...\n\nAOR\n오늘 배운 내용...'}
        />
      </div>

      <div className="actions">
        <button onClick={handleParse} disabled={!text.trim()}>
          파싱하기
        </button>
        {parsed && (
          <button onClick={handleSave} className="primary" disabled={saved}>
            {saved ? '저장됨' : '이 날짜로 저장'}
          </button>
        )}
      </div>

      {parsed && byCourse && (
        <div className="preview">
          <h3>파싱 결과 미리보기</h3>
          {byCourse.size === 0 && <p className="hint">인식된 과목 블록이 없습니다.</p>}
          {[...byCourse.entries()].map(([courseId, blocks]) => (
            <div key={courseId} className="preview-course">
              <h4>{courseName(courses, courseId)}</h4>
              {F_TYPE_ORDER.map((f) =>
                blocks[f] ? (
                  <div key={f} className="preview-block">
                    <div className="preview-block-label">{F_TYPE_LABELS[f]}</div>
                    <div className="preview-block-text">{blocks[f]}</div>
                  </div>
                ) : null,
              )}
            </div>
          ))}

          {parsed.unclassified.length > 0 && (
            <div className="preview-unclassified">
              <h4>미분류로 이동될 항목 ({parsed.unclassified.length}개)</h4>
              {parsed.unclassified.map((u, i) => (
                <div key={i} className="preview-block">
                  <div className="preview-block-label">
                    {u.fType ? F_TYPE_LABELS[u.fType] : '태그 없음'}
                    {u.guessedHeader ? ` · 헤더 추정: "${u.guessedHeader}"` : ''}
                  </div>
                  <div className="preview-block-text">{u.rawText}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
