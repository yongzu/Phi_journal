import { useState } from 'react';
import type { Course, DailyCourseEntry, FType, UnclassifiedItem } from '../types';
import { F_TYPE_LABELS, F_TYPE_ORDER } from '../types';
import { appendTextToEntry } from '../lib/entryOps';

interface Props {
  courses: Course[];
  entries: DailyCourseEntry[];
  setEntries: (fn: (prev: DailyCourseEntry[]) => DailyCourseEntry[]) => void;
  unclassified: UnclassifiedItem[];
  setUnclassified: (fn: (prev: UnclassifiedItem[]) => UnclassifiedItem[]) => void;
}

export default function UnclassifiedPage({ courses, setEntries, unclassified, setUnclassified }: Props) {
  const pending = unclassified.filter((u) => !u.resolved);
  const [choices, setChoices] = useState<Record<string, { courseId: string; fType: FType }>>({});

  function choiceFor(item: UnclassifiedItem) {
    return choices[item.id] ?? { courseId: courses[0]?.id ?? 'general', fType: item.fType ?? 'fact' };
  }

  function setChoice(item: UnclassifiedItem, patch: Partial<{ courseId: string; fType: FType }>) {
    setChoices((prev) => ({ ...prev, [item.id]: { ...choiceFor(item), ...patch } }));
  }

  function resolve(item: UnclassifiedItem) {
    const choice = choiceFor(item);
    setEntries((prev) => appendTextToEntry(prev, item.date, choice.courseId, choice.fType, item.rawText));
    setUnclassified((prev) => prev.map((u) => (u.id === item.id ? { ...u, resolved: true } : u)));
  }

  function discard(item: UnclassifiedItem) {
    setUnclassified((prev) => prev.map((u) => (u.id === item.id ? { ...u, resolved: true } : u)));
  }

  return (
    <div className="page">
      <h2>미분류 항목 ({pending.length})</h2>
      <p className="hint">자동 파싱에서 과목을 인식하지 못한 텍스트입니다. 과목과 유형을 지정해 아카이브에 합치거나, 무시할 수 있습니다.</p>

      {pending.length === 0 && <p className="hint">미분류 항목이 없습니다.</p>}

      {pending.map((item) => {
        const choice = choiceFor(item);
        return (
          <div key={item.id} className="unclassified-item">
            <div className="unclassified-meta">
              <span>{item.date}</span>
              {item.guessedHeader && <span> · 헤더 추정: "{item.guessedHeader}"</span>}
              {item.fType && <span> · 원래 태그: {F_TYPE_LABELS[item.fType]}</span>}
            </div>
            <div className="preview-block-text">{item.rawText}</div>
            <div className="unclassified-controls">
              <select value={choice.courseId} onChange={(e) => setChoice(item, { courseId: e.target.value })}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={choice.fType}
                onChange={(e) => setChoice(item, { fType: e.target.value as FType })}
              >
                {F_TYPE_ORDER.map((f) => (
                  <option key={f} value={f}>
                    {F_TYPE_LABELS[f]}
                  </option>
                ))}
              </select>
              <button className="primary" onClick={() => resolve(item)}>
                이 과목으로 분류
              </button>
              <button onClick={() => discard(item)}>무시</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
