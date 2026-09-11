import { useEffect, useState } from 'react';
import type { Course, DailyCourseEntry, RawJournalLog, UnclassifiedItem } from './types';
import {
  loadCourses,
  saveCourses,
  loadEntries,
  saveEntries,
  loadUnclassified,
  saveUnclassified,
  loadRawLogs,
  saveRawLogs,
} from './lib/storage';
import InputPage from './pages/InputPage';
import UnclassifiedPage from './pages/UnclassifiedPage';
import ArchivePage from './pages/ArchivePage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

type Tab = 'input' | 'unclassified' | 'archive' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('input');
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [entries, setEntries] = useState<DailyCourseEntry[]>(() => loadEntries());
  const [unclassified, setUnclassified] = useState<UnclassifiedItem[]>(() => loadUnclassified());
  const [rawLogs, setRawLogs] = useState<RawJournalLog[]>(() => loadRawLogs());

  useEffect(() => saveCourses(courses), [courses]);
  useEffect(() => saveEntries(entries), [entries]);
  useEffect(() => saveUnclassified(unclassified), [unclassified]);
  useEffect(() => saveRawLogs(rawLogs), [rawLogs]);

  const pendingCount = unclassified.filter((u) => !u.resolved).length;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Phi Journal</h1>
        <nav className="tabs">
          <button className={tab === 'input' ? 'active' : ''} onClick={() => setTab('input')}>
            오늘 작성
          </button>
          <button className={tab === 'unclassified' ? 'active' : ''} onClick={() => setTab('unclassified')}>
            미분류 {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </button>
          <button className={tab === 'archive' ? 'active' : ''} onClick={() => setTab('archive')}>
            과목별 아카이브
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
            설정
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'input' && (
          <InputPage
            courses={courses}
            entries={entries}
            setEntries={setEntries}
            unclassified={unclassified}
            setUnclassified={setUnclassified}
            rawLogs={rawLogs}
            setRawLogs={setRawLogs}
          />
        )}
        {tab === 'unclassified' && (
          <UnclassifiedPage
            courses={courses}
            entries={entries}
            setEntries={setEntries}
            unclassified={unclassified}
            setUnclassified={setUnclassified}
          />
        )}
        {tab === 'archive' && <ArchivePage courses={courses} entries={entries} setEntries={setEntries} />}
        {tab === 'settings' && (
          <SettingsPage
            courses={courses}
            setCourses={setCourses}
            entries={entries}
            setEntries={setEntries}
            unclassified={unclassified}
            setUnclassified={setUnclassified}
            rawLogs={rawLogs}
            setRawLogs={setRawLogs}
          />
        )}
      </main>
    </div>
  );
}
