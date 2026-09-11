import { useMemo, useState } from 'react';
import type { Course, DailyCourseEntry } from '../types';
import { F_TYPE_LABELS, F_TYPE_ORDER } from '../types';

interface Props {
  courses: Course[];
  entries: DailyCourseEntry[];
  setEntries: (fn: (prev: DailyCourseEntry[]) => DailyCourseEntry[]) => void;
}

export default function ArchivePage({ courses, entries, setEntries }: Props) {
  const activeCourses = courses.filter((c) => !c.archived);
  const [courseId, setCourseId] = useState(activeCourses[0]?.id ?? '');

  const courseEntries = useMemo(
    () =>
      entries
        .filter((e) => e.courseId === courseId)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries, courseId],
  );

  function removeEntry(id: string) {
    if (!confirm('이 날짜의 기록을 삭제할까요?')) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="page archive-page">
      <h2>과목별 아카이브</h2>
      <div className="course-list">
        {activeCourses.map((c) => {
          const count = entries.filter((e) => e.courseId === c.id).length;
          return (
            <button
              key={c.id}
              className={c.id === courseId ? 'course-chip active' : 'course-chip'}
              onClick={() => setCourseId(c.id)}
            >
              {c.name} {count > 0 && <span className="badge-inline">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="timeline">
        {courseEntries.length === 0 && <p className="hint">아직 기록이 없습니다.</p>}
        {courseEntries.map((entry) => (
          <div key={entry.id} className="timeline-entry">
            <div className="timeline-header">
              <strong>{entry.date}</strong>
              <button className="link-danger" onClick={() => removeEntry(entry.id)}>
                삭제
              </button>
            </div>
            {F_TYPE_ORDER.map((f) =>
              entry.blocks[f] ? (
                <div key={f} className="preview-block">
                  <div className="preview-block-label">{F_TYPE_LABELS[f]}</div>
                  <div className="preview-block-text">{entry.blocks[f]}</div>
                </div>
              ) : null,
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
