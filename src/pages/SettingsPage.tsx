import { useRef, useState } from 'react';
import type { Course, DailyCourseEntry, RawJournalLog, UnclassifiedItem } from '../types';
import { GENERAL_COURSE_ID } from '../types';
import { newId } from '../lib/id';
import { exportAllData, importAllData, type ExportedData } from '../lib/storage';

interface Props {
  courses: Course[];
  setCourses: (fn: (prev: Course[]) => Course[]) => void;
  entries: DailyCourseEntry[];
  setEntries: (fn: (prev: DailyCourseEntry[]) => DailyCourseEntry[]) => void;
  unclassified: UnclassifiedItem[];
  setUnclassified: (fn: (prev: UnclassifiedItem[]) => UnclassifiedItem[]) => void;
  rawLogs: RawJournalLog[];
  setRawLogs: (fn: (prev: RawJournalLog[]) => RawJournalLog[]) => void;
}

export default function SettingsPage({
  courses,
  setCourses,
  setEntries,
  setUnclassified,
  setRawLogs,
}: Props) {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addCourse() {
    if (!newCode.trim() || !newName.trim()) return;
    setCourses((prev) => [
      ...prev,
      { id: newId(), code: newCode.trim(), name: newName.trim(), aliases: [] },
    ]);
    setNewCode('');
    setNewName('');
  }

  function updateCourse(id: string, patch: Partial<Course>) {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCourse(id: string) {
    if (id === GENERAL_COURSE_ID) return;
    if (!confirm('이 과목을 삭제할까요? (해당 과목으로 저장된 아카이브 기록은 남아있지만 목록에서 사라집니다)')) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phi-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ExportedData;
        if (!confirm('가져오기를 하면 현재 브라우저에 저장된 데이터를 덮어씁니다. 계속할까요?')) return;
        importAllData(data);
        setCourses(() => data.courses ?? []);
        setEntries(() => data.entries ?? []);
        setUnclassified(() => data.unclassified ?? []);
        setRawLogs(() => data.rawLogs ?? []);
        alert('가져오기 완료');
      } catch {
        alert('파일을 읽을 수 없습니다. 올바른 백업 JSON 파일인지 확인하세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="page">
      <h2>과목 관리</h2>
      <p className="hint">
        저널에서 쓰는 과목 코드(예: BI, AOR, SI)와 정식 이름을 맞춰주세요. 코드가 저널 헤더와 일치해야 자동 분류됩니다.
      </p>

      <table className="course-table">
        <thead>
          <tr>
            <th>코드</th>
            <th>이름</th>
            <th>별칭(쉼표 구분)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id}>
              <td>
                <input
                  value={c.code}
                  disabled={c.id === GENERAL_COURSE_ID}
                  onChange={(e) => updateCourse(c.id, { code: e.target.value })}
                />
              </td>
              <td>
                <input value={c.name} onChange={(e) => updateCourse(c.id, { name: e.target.value })} />
              </td>
              <td>
                <input
                  value={c.aliases.join(', ')}
                  onChange={(e) =>
                    updateCourse(c.id, {
                      aliases: e.target.value
                        .split(',')
                        .map((a) => a.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </td>
              <td>
                {c.id !== GENERAL_COURSE_ID && (
                  <button className="link-danger" onClick={() => removeCourse(c.id)}>
                    삭제
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="add-course-row">
        <input placeholder="코드 (예: BI)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
        <input placeholder="이름 (예: Beautiful Interface)" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button onClick={addCourse}>과목 추가</button>
      </div>

      <h2>데이터 백업</h2>
      <p className="hint">
        이 앱은 브라우저 로컬저장소(localStorage)에만 데이터를 저장합니다. 브라우저 데이터를 지우면 기록이 사라질 수 있으니
        주기적으로 내보내기를 권장합니다.
      </p>
      <div className="actions">
        <button onClick={handleExport}>JSON으로 내보내기</button>
        <button onClick={handleImportClick}>JSON 가져오기</button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>
    </div>
  );
}
