import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Defs } from './art.jsx';
import { MISSIONS } from './logic.js';
import { Landing, MapScreen, Brief, Help, Dev, Book, Teacher, isUnlocked, totalPoints } from './screens.jsx';
import Workspace from './workspace.jsx';
import { syncEnabled, pushProgress } from './sync.js';

// Progres disimpan per siswa (nama + kelas + sekolah), jadi komputer bersama tidak mencampur data.
const blank = { profile: null, done: {}, book: {}, teacher: false };
const keyOf = (p) => 'egatra-v2:' + [p.name, p.klass, p.school].map((v) => (v || '').trim().toLowerCase().replace(/\s+/g, ' ')).join('|');
function load(profile) {
  try { const v = JSON.parse(localStorage.getItem(keyOf(profile))); if (v && v.done) return { ...blank, ...v, profile, teacher: false }; } catch (e) { /* tanpa penyimpanan */ }
  return { ...blank, profile };
}

function App() {
  const [save, setSave] = useState(blank);
  const [screen, setScreen] = useState('landing');
  const [modal, setModal] = useState(null);
  const [play, setPlay] = useState(null);
  const [sync, setSync] = useState('local');
  const ref = useRef(save);
  ref.current = save;
  useEffect(() => { if (!save.profile) return; try { localStorage.setItem(keyOf(save.profile), JSON.stringify(save)); } catch (e) { /* abaikan */ } }, [save]);
  useEffect(() => {
    if (!save.profile || !Object.keys(save.done).length) return undefined;
    const t = setTimeout(() => pushProgress(save, setSync), 900);
    return () => clearTimeout(t);
  }, [save.done, save.profile]);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const commit = (fn) => { const n = fn(ref.current); ref.current = n; setSave(n); return n; };

  const onWin = ({ sector, no, score, f, roots, rootsOnly }) => {
    const k = `${sector}-${no}`;
    const before = ref.current;
    const nextS = sector + 1;
    const wasOpen = nextS <= 4 ? isUnlocked(before, nextS) : true;
    const after = commit((s) => ({
      ...s,
      done: rootsOnly ? s.done : { ...s.done, [k]: Math.max(s.done[k] || 0, score) },
      book: { ...s.book, [k]: { f, roots: roots || s.book[k]?.roots || null } },
    }));
    const nowOpen = nextS <= 4 ? isUnlocked(after, nextS) : true;
    return { unlocked: !wasOpen && nowOpen ? nextS : null, total: totalPoints(after.done) };
  };

  return (
    <>
      <Defs />
      {screen === 'landing' && <Landing initial={null} canTeach={syncEnabled} onTeacher={() => setScreen('teacher')} onStart={(p) => { const n = load(p); ref.current = n; setSave(n); setScreen('map'); }} />}
      {screen === 'teacher' && <Teacher onBack={() => setScreen('landing')} />}
      {screen === 'map' && save.profile && (
        <MapScreen sync={sync} save={save} onOpen={setModal} onPick={(s) => setModal({ brief: s })}
          onToggleTeacher={() => commit((s) => ({ ...s, teacher: !s.teacher }))} onBack={() => { ref.current = blank; setSave(blank); setScreen('landing'); }} />
      )}
      {screen === 'play' && play && (
        <Workspace key={`${play.sector}-${play.no}-${play.lengkapi}-${play.rev}`} sector={play.sector} mission={MISSIONS[play.sector][play.no - 1]} lengkapi={play.lengkapi}
          save={save} onWin={onWin} onExit={() => setScreen('map')}
          onNext={() => setPlay({ ...play, no: play.no + 1, rev: 0 })} onRetry={() => setPlay({ ...play, rev: play.rev + 1 })} />
      )}
      {modal && modal.brief && (
        <Brief sector={modal.brief} save={save} onClose={() => setModal(null)}
          onStart={(no, lengkapi) => { setPlay({ sector: modal.brief, no, lengkapi, rev: 0 }); setModal(null); setScreen('play'); }} />
      )}
      {modal === 'help' && <Help onClose={() => setModal(null)} />}
      {modal === 'dev' && <Dev onClose={() => setModal(null)} />}
      {modal === 'book' && <Book save={save} onClose={() => setModal(null)} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
