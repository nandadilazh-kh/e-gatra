import React, { useState } from 'react';
import { TileArt } from './art.jsx';
import { MISSIONS, SECTORS, solutionTiles, val, GEO } from './logic.js';
import { Eq, Fac, Modal, Icon, IMG, Frac, Root } from './ui.jsx';
import { fetchRows } from './sync.js';

export const NEED_PTS = 1050;
export function sectorStats(done, s) {
  let n = 0, pts = 0;
  for (let i = 1; i <= 15; i++) { const v = done[`${s}-${i}`]; if (v) { n++; pts += v; } }
  return { n, pts };
}
export function isUnlocked(save, s) {
  if (s === 1 || save.teacher) return true;
  const p = sectorStats(save.done, s - 1);
  return p.n >= 15 && p.pts >= NEED_PTS;
}
export function lockReason(save, s) {
  const p = sectorStats(save.done, s - 1);
  const parts = [];
  if (p.n < 15) parts.push(`selesaikan semua misi Sektor ${s - 1} (${p.n}/15)`);
  if (p.pts < NEED_PTS) parts.push(`kumpulkan ${NEED_PTS} poin di sektor itu (${p.pts})`);
  return 'Terkunci. Untuk membuka: ' + parts.join(' dan ') + '.';
}
export const totalPoints = (done) => Object.values(done).reduce((a, b) => a + b, 0);

/* ---------- Landing ---------- */
function HeroPlan() {
  const u = 34, x = 3;
  const tiles = solutionTiles({ p: 1, q: 1, m: 3, n: 2 });
  const W = (x + 3) * u, H = (x + 2) * u;
  return (
    <svg viewBox={`0 0 ${W + 90} ${H + 80}`} className="w-full landing-tiles" role="img" aria-label="Denah contoh: bangunan, jalan setapak, dan petak bunga membentuk persegi panjang dengan sisi x + 3 dan x + 2">
      <g transform="translate(70,44)">
        {tiles.map((t, i) => {
          const w = (t.key === 'x2' || (t.key.includes('x') && !t.rot) ? x : 1) * u;
          const h = (t.key === 'x2' || (t.key.includes('x') && t.rot) ? x : 1) * u;
          const px = (t.X[0] * x + t.X[1] - 1) * u, py = (t.Y[0] * x + t.Y[1] - 1) * u;
          return <g key={i} transform={`translate(${px},${py})`}><g className="lt" style={{ animationDelay: `${(i % 7) * 0.35}s` }}><TileArt k={t.key} w={w} h={h} view="city" sector={1} /></g></g>;
        })}
        <g stroke="var(--ink)" strokeWidth="2" fill="none"><path d={`M0,-14 H${W}`} /><path d={`M0,-20 V-8 M${W},-20 V-8`} /><path d={`M-14,0 V${H}`} /><path d={`M-20,0 H-8 M-20,${H} H-8`} /></g>
        <text x={W / 2} y="-24" textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--ink)" style={{ fontFamily: 'var(--font-display)' }}>x + 3</text>
        <text transform={`translate(-26,${H / 2}) rotate(-90)`} textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--ink)" style={{ fontFamily: 'var(--font-display)' }}>x + 2</text>
      </g>
    </svg>
  );
}

export function Landing({ initial, onStart, canTeach, onTeacher }) {
  const [name, setName] = useState(initial?.name || '');
  const [klass, setKlass] = useState(initial?.klass || '');
  const [school, setSchool] = useState(initial?.school || '');
  const [err, setErr] = useState('');
  const go = (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr('Isi nama dulu supaya Poin Arsitekmu tercatat.'); return; }
    onStart({ name: name.trim(), klass: klass.trim(), school: school.trim() });
  };
  return (
    <div className="wrap grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center min-h-[calc(100dvh-60px)] py-4">
      <section className="min-w-0 order-2 lg:order-1">
        <p className="m-0 font-bold" style={{ color: 'var(--muted)' }}>Media Belajar Persamaan Kuadrat</p>
        <h1 className="display font-extrabold leading-[0.95]" style={{ fontSize: 'clamp(3.4rem, 11vw, 6.6rem)', color: 'var(--brand)' }}>E-GATRA</h1>
        <p className="display font-bold text-xl sm:text-2xl mt-2 mb-0">Griya Aljabar Tata Ruang Arsitektur</p>
        <div className="max-w-[460px] mt-3"><HeroPlan /></div>
        <p className="max-w-[56ch] m-0" style={{ color: 'var(--muted)' }}>
          Gatra berarti wujud atau tatanan. Susun bangunan, jalan setapak, dan petak bunga di atas cetak biru sampai membentuk denah persegi panjang utuh. Panjang dan lebarnya adalah faktor persamaan kuadrat.
        </p>
      </section>
      <section className="order-1 lg:order-2 min-w-0">
        <form onSubmit={go} className="card p-5 sm:p-7 grid gap-4" noValidate>
          <h2 className="text-2xl font-extrabold">Daftar Arsitek</h2>
          <div className="field"><label htmlFor="f-name">Nama</label><input id="f-name" className="input" value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} autoComplete="name" placeholder="Nama lengkap" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field"><label htmlFor="f-class">Kelas</label><input id="f-class" className="input" value={klass} onChange={(e) => setKlass(e.target.value)} placeholder="Contoh: X" /></div>
            <div className="field"><label htmlFor="f-school">Asal sekolah</label><input id="f-school" className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Nama sekolah" /></div>
          </div>
          {err && <p role="alert" className="m-0 p-3 rounded-xl font-semibold" style={{ background: 'var(--soft-warn)' }}>{err}</p>}
          <button className="btn btn-primary text-lg" style={{ minHeight: 52 }} type="submit">Mulai Membangun</button>
          {canTeach && <button className="btn" type="button" onClick={onTeacher}>Rekap Guru</button>}
          <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="rounded-xl p-2 bg-white shrink-0"><img src={IMG.logo} alt="Logo Universitas Negeri Malang" width="150" style={{ display: 'block' }} /></div>
            <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>Dikembangkan di Universitas Negeri Malang, Jl. Cakrawala No.5, Sumbersari, Kec. Lowokwaru, Kota Malang </p>
          </div>
        </form>
      </section>
    </div>
  );
}

/* ---------- Peta wilayah ---------- */
const POS = { 1: [175, 190], 2: [495, 150], 3: [560, 400], 4: [850, 255] };
const DW = 270, DH = 190;
function District({ s }) {
  const g = (children) => <g>{children}</g>;
  if (s === 1) {
    const houses = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x = -100 + c * 70, y = -48 + r * 70;
      houses.push(<g key={r + '-' + c} transform={`translate(${x},${y})`}><rect width="52" height="44" rx="4" fill="#e9b793" /><rect x="4" y="4" width="44" height="36" rx="3" fill="#c4572f" /><line x1="4" x2="48" y1="22" y2="22" stroke="#7a2e14" strokeWidth="2" /><circle cx="60" cy="40" r="8" fill="#4ea36c" /></g>);
    }
    return g(houses);
  }
  if (s === 2) {
    const blocks = [];
    [[-105, -50, 58, 70], [-38, -62, 66, 82], [38, -44, 56, 64], [-95, 38, 70, 40], [-12, 34, 64, 44], [62, 32, 50, 46]].forEach(([x, y, w, h], i) => {
      blocks.push(<g key={i} transform={`translate(${x},${y})`}><rect width={w} height={h} rx="4" fill="#7f9bbd" /><rect x="4" y="4" width={w - 8} height={h * 0.55} rx="2" fill="#b9cbe0" /><rect y={h - 9} width={w} height="9" fill="#e0661a" /><rect x={w * 0.2} y={h - 9} width={w * 0.2} height="9" fill="#fff6e6" /><rect x={w * 0.6} y={h - 9} width={w * 0.2} height="9" fill="#fff6e6" /></g>);
    });
    return g(blocks);
  }
  if (s === 3) {
    return g(<>
      <rect x="-110" y="-70" width="220" height="140" rx="12" fill="#e8dbbd" />
      <circle r="52" fill="#cdebf8" stroke="#2b8fc9" strokeWidth="4" /><circle r="32" fill="#72c3ea" /><circle r="9" fill="#fff" />
      {[[-86, -48], [86, -48], [-86, 48], [86, 48]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="14" fill="#4ea36c" />)}
    </>);
  }
  return g(<>
    <rect x="-112" y="-30" width="150" height="76" rx="4" fill="#6f7b8a" />
    {[0, 1, 2, 3].map((i) => <polygon key={i} points={`${-112 + i * 37.5},-30 ${-112 + i * 37.5},-62 ${-112 + (i + 1) * 37.5},-30`} fill="#a7b1be" />)}
    <rect x="50" y="-60" width="22" height="106" rx="3" fill="#8d98a7" /><circle cx="61" cy="-66" r="13" fill="#3c4450" stroke="#d4581f" strokeWidth="4" />
    <circle cx="61" cy="-86" r="9" fill="#fff" opacity=".7" /><circle cx="68" cy="-102" r="7" fill="#fff" opacity=".5" />
    <path d="M-112 64 H112" stroke="#3d4450" strokeWidth="3" /><path d="M-112 72 H112" stroke="#3d4450" strokeWidth="3" />
    {Array.from({ length: 18 }).map((_, i) => <line key={i} x1={-108 + i * 12.5} x2={-108 + i * 12.5} y1="60" y2="76" stroke="#5b4636" strokeWidth="3" />)}
  </>);
}

const FILL = { 1: '#d3ecc9', 2: '#d3e1f4', 3: '#f5e7bf', 4: '#e6d3c6' };

export function MapScreen({ sync, save, onPick, onOpen, onToggleTeacher, onBack }) {
  const [msg, setMsg] = useState('');
  const pts = totalPoints(save.done);
  const pick = (s) => {
    if (!isUnlocked(save, s)) { setMsg(`Sektor ${s} ${lockReason(save, s)}`); return; }
    setMsg(''); onPick(s);
  };
  return (
    <div className="wrap grid gap-4">
      <header className="flex flex-wrap items-center gap-3 justify-between">
        <div className="min-w-0">
          <h1 className="display text-3xl font-extrabold" style={{ color: 'var(--brand)' }}>Peta Wilayah</h1>
          <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>Arsitek {save.profile.name}{save.profile.klass ? ` · ${save.profile.klass}` : ''}{save.profile.school ? ` · ${save.profile.school}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="chip" style={{ background: 'var(--soft-warn)' }}><Icon.star style={{ color: 'var(--sun)' }} /> {pts} Poin Arsitek</span>
          <span className="chip" title={sync === 'synced' ? 'Progres terkirim ke guru' : 'Progres tersimpan di perangkat ini.'}>{sync === 'synced' ? 'Terkirim ke guru' : 'Tersimpan di perangkat'}</span>
          <button className="btn btn-sm" onClick={() => onOpen('help')}><Icon.help /> Petunjuk Penggunaan</button>
          <button className="btn btn-sm" onClick={() => onOpen('dev')}><Icon.user /> Profil Pengembang</button>
          <button className="btn btn-sm" onClick={() => onOpen('book')}><Icon.book /> Buku Proyek</button>
          <button className="btn btn-sm" onClick={onBack}>Ganti Arsitek</button>
        </div>
      </header>
      {msg && <p role="status" className="m-0 p-3 rounded-xl font-semibold" style={{ background: 'var(--soft-info)' }}>{msg}</p>}
      <div className="card overflow-hidden" style={{ borderRadius: 22 }}>
        <svg viewBox="0 0 1000 560" className="block w-full h-auto" role="group" aria-label="Peta kawasan kota dengan empat sektor">
          <rect width="1000" height="560" fill="var(--map-land)" />
          <path d="M-20 470 C 180 400, 340 520, 520 470 S 840 380, 1020 440" fill="none" stroke="var(--map-water)" strokeWidth="54" strokeLinecap="round" />
          <path d="M-20 470 C 180 400, 340 520, 520 470 S 840 380, 1020 440" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeDasharray="2 16" strokeLinecap="round" />
          <path className="map-trail" d="M175,190 C 300,120 380,190 495,150 S 560,300 560,400 S 760,400 850,255" fill="none" stroke="var(--ink)" strokeOpacity=".4" strokeWidth="5" />
          {[1, 2, 3, 4].map((s) => {
            const [cx, cy] = POS[s];
            const open = isUnlocked(save, s);
            const st = sectorStats(save.done, s);
            return (
              <g key={s} transform={`translate(${cx},${cy})`} className="district" role="button" tabIndex={0}
                aria-label={`Sektor ${s}, ${SECTORS[s].name}. ${open ? `${st.n} dari 15 misi selesai` : 'Terkunci'}`}
                onClick={() => pick(s)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(s))}>
                <rect className="d-frame" x={-DW / 2} y={-DH / 2} width={DW} height={DH} rx="40" fill={FILL[s]} stroke={open ? `var(--s${s})` : 'var(--muted)'} strokeWidth="4" />
                <g className={open ? '' : 'locked-art'}><District s={s} /></g>
                <g transform={`translate(${-DW / 2 + 6},${-DH / 2 + 6})`}><circle r="22" fill={`var(--s${s})`} /><text textAnchor="middle" dominantBaseline="central" fontSize="24" fontWeight="800" fill="#fff" style={{ fontFamily: 'var(--font-display)' }}>{s}</text></g>
                <g transform={`translate(0,${DH / 2 + 22})`}>
                  <rect x="-118" y="-17" width="236" height="34" rx="17" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="800" fill="var(--ink)" style={{ fontFamily: 'var(--font-display)' }}>{SECTORS[s].name}</text>
                </g>
                {open ? (
                  <g transform={`translate(${DW / 2 - 6},${-DH / 2 + 8})`}><rect x="-82" y="-14" width="82" height="28" rx="14" fill="var(--surface)" stroke="var(--line)" /><text x="-41" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="700" fill="var(--ink)">{st.n}/15 misi</text></g>
                ) : (
                  <g>
                    <circle r="40" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3" />
                    <g transform="translate(-22,-22) scale(1.83)" style={{ color: 'var(--ink)' }}><Icon.lock width="24" height="24" /></g>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((s) => {
          const st = sectorStats(save.done, s), open = isUnlocked(save, s);
          return (
            <button key={s} className="card p-4 text-left cursor-pointer" style={{ borderColor: open ? `var(--s${s})` : 'var(--line)', borderWidth: 2 }} onClick={() => pick(s)} aria-label={`Buka Sektor ${s}`}>
              <div className="flex items-center justify-between gap-2"><strong className="display text-lg">Sektor {s}</strong>{open ? <span className="chip">{st.pts} poin</span> : <span className="chip"><Icon.lock /> Terkunci</span>}</div>
              <div className="font-semibold">{SECTORS[s].name}</div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>{SECTORS[s].materi}</div>
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}><div style={{ width: `${(st.n / 15) * 100}%`, height: '100%', background: `var(--s${s})` }} /></div>
            </button>
          );
        })}
      </div>
      <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>Syarat membuka sektor berikutnya: semua 15 misi selesai dan minimal {NEED_PTS} poin di sektor sebelumnya. Setiap misi bernilai 100 poin, dikurangi 10 poin untuk tiap petunjuk (minimal 50).</p>
      <div><button className="btn btn-sm" onClick={onToggleTeacher} aria-pressed={save.teacher}>{save.teacher ? 'Mode Guru aktif: semua sektor terbuka' : 'Mode Guru: buka semua sektor'}</button></div>
    </div>
  );
}

/* ---------- Mission briefing ---------- */
const STORY = {
  1: (eq) => <>Selamat datang, Arsitek! Wali kota meminta kita membangun kompleks perumahan seluas {eq}. Siapkan lahannya!</>,
  2: (eq) => <>Pusat perbelanjaan baru akan berdiri seluas {eq}. Lahannya punya parit dan kolam. Seimbangkan dengan pasangan nol supaya denahnya utuh.</>,
  3: (eq) => <>Warga ingin alun-alun yang simetris dengan luas {eq}. Panjang dan lebarnya harus sama.</>,
  4: (eq) => <>Kawasan industri raksasa dengan luas {eq} akan dibangun. Kamu butuh beberapa bangunan utama sekaligus. Setelah denah jadi, cari akarnya.</>,
};
export function Brief({ sector, save, initialNo, onStart, onClose }) {
  const first = initialNo || (() => { for (let i = 1; i <= 15; i++) if (!save.done[`${sector}-${i}`]) return i; return 1; })();
  const [no, setNo] = useState(first);
  const [lengkapi, setLengkapi] = useState(false);
  const m = MISSIONS[sector][no - 1];
  const eq = <strong><Eq a={m.a} b={m.b} c={m.c} zero={sector === 4} lengkapi={sector === 3 && lengkapi} /></strong>;
  return (
    <Modal title={`Sektor ${sector}: ${SECTORS[sector].name}`} onClose={onClose} label="Misi">
      <p className="m-0 mb-3 text-lg">{STORY[sector](eq)}</p>
      <div className="p-3 rounded-xl mb-3" style={{ background: 'var(--soft-info)' }}>
        <div className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Target luas kawasan</div>
        <div className="display text-3xl font-extrabold"><Eq a={m.a} b={m.b} c={m.c} zero={sector === 4} lengkapi={sector === 3 && lengkapi} /></div>
      </div>
      {sector === 3 && (
        <div className="mb-3">
          <div className="seg" role="group" aria-label="Mode alun-alun">
            <button aria-pressed={!lengkapi} onClick={() => setLengkapi(false)}>Mode Susun</button>
            <button aria-pressed={lengkapi} onClick={() => setLengkapi(true)}>Mode Lengkapi</button>
          </div>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>{lengkapi ? 'Hanya bangunan dan jalan yang diberikan. Cari dan tambahkan sendiri petak bunga yang kurang.' : 'Semua bahan sudah diberikan. Susun menjadi persegi.'}</p>
        </div>
      )}
      <div className="mb-4">
        <div className="font-bold mb-1">Pilih misi</div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih nomor misi">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((i) => {
            const d = save.done[`${sector}-${i}`];
            return (
              <button key={i} onClick={() => setNo(i)} aria-pressed={i === no} aria-label={`Misi ${i}${d ? ', selesai' : ''}`}
                className="btn btn-sm" style={{ minWidth: 44, background: i === no ? 'var(--brand)' : d ? 'var(--soft-ok)' : 'var(--surface)', color: i === no ? 'var(--brand-ink)' : 'var(--ink)', borderColor: i === no ? 'var(--brand)' : 'var(--line)' }}>
                {d && i !== no ? <Icon.check /> : null}{i}
              </button>
            );
          })}
        </div>
      </div>
      <button className="btn btn-primary w-full text-lg" onClick={() => onStart(no, lengkapi)}>Masuk Area Kerja</button>
    </Modal>
  );
}

/* ---------- Petunjuk penggunaan ---------- */
function Mini({ children, w = 300, h = 120 }) {
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[360px] mx-auto block rounded-xl" style={{ background: 'var(--cv-bg)', border: '1.5px solid var(--cv-frame)' }} aria-hidden="true"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--accent)" /></marker></defs>{children}</svg>;
}
const T = (k, x, y, w, h, view = 'city') => <g transform={`translate(${x},${y})`}><TileArt k={k} w={w} h={h} view={view} sector={1} /></g>;
const Arrow = ({ d }) => <path d={d} stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" markerEnd="url(#ah)" />;
const HELP = [
  { t: 'Tarik ubin dari tray', p: 'Tahan ubin di panel kiri (Inventory Tray), lalu seret ke kanvas. Lepaskan dekat susunan. Ubin otomatis merapat dengan presisi (auto-snap). Jumlah di lencana menunjukkan sisa bahan.',
    d: <Mini>{T('x2', 20, 30, 56, 56)}<Arrow d="M90,58 C130,20 150,20 170,50" />{T('x2', 190, 32, 56, 56)}{T('x', 246, 32, 18, 56)}</Mini> },
  { t: 'Sisi harus cocok', p: 'Sisi x hanya boleh menempel pada sisi x, dan sisi 1 pada sisi 1. Kalau tidak cocok, ubin ditolak dan kembali. Tidak ada bunyi dan tidak ada tanda merah, coba lagi saja.',
    d: <Mini>{T('x2', 20, 20, 60, 60)}{T('x', 80, 20, 20, 60)}<text x="60" y="108" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">x dengan x: cocok</text>{T('x2', 170, 20, 60, 60)}{T('u', 230, 20, 20, 20)}<text x="210" y="108" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">1 dengan x: ditolak</text></Mini> },
  { t: 'Putar jalan setapak', p: 'Ubin jalan setapak (x) dan parit (−x) bisa diputar 90°. Di tray, tekan tombol Putar sebelum menyeret. Di kanvas, pilih ubin lalu tekan tombol Putar atau tombol R pada keyboard.',
    d: <Mini>{T('x', 40, 50, 60, 20)}<Arrow d="M115,60 C130,30 150,30 165,55" />{T('x', 200, 20, 20, 60)}</Mini> },
  { t: 'Bentuk persegi panjang utuh', p: 'Susun semua bahan sampai menjadi satu persegi panjang tanpa celah dan tanpa tumpang tindih. Saat susunan benar, tepi atas dan samping kanvas menampilkan panjang dan lebar. Itulah faktor persamaannya.',
    d: <Mini w={300} h={130}>{T('x2', 70, 30, 50, 50)}{T('x', 120, 30, 16, 50)}{T('x', 136, 30, 16, 50)}{T('x', 70, 80, 50, 16)}{T('u', 120, 80, 16, 16)}{T('u', 136, 80, 16, 16)}<path d="M70,22 H152" stroke="var(--ink)" strokeWidth="2" /><text x="111" y="16" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ink)">x + 2</text><text x="60" y="66" textAnchor="end" fontSize="12" fontWeight="800" fill="var(--ink)">x + 1</text></Mini> },
  { t: 'Mode dan slider x', p: 'Sakelar Mode Kota atau Mode Aljabar mengganti tampilan ubin tanpa mengubah susunan. Slider x membesarkan atau mengecilkan denah. Nilai x bukan angka tetap, tapi susunannya tetap berlaku untuk semua x.',
    d: <Mini>{T('x2', 20, 30, 56, 56)}{T('x2', 96, 30, 56, 56, 'alg')}{T('x2', 190, 44, 36, 36)}<text x="208" y="100" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">x kecil</text><text x="48" y="104" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">Kota</text><text x="124" y="104" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">Aljabar</text></Mini> },
  { t: 'Pasangan nol (Sektor 2 ke atas)', p: 'Ubin negatif diberi pola garis diagonal supaya mudah dibedakan. Satu jalan setapak dan satu parit saling meniadakan, begitu pula petak bunga dan kolam mini. Tambahkan pasangan nol bila perlu, lalu pakai semuanya di denah. Tombol Bersihkan Zona membuang pasangan yang saling bersentuhan.',
    d: <Mini>{T('x', 40, 30, 60, 20)}{T('nx', 40, 50, 60, 20)}<text x="70" y="96" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">x + (−x) = 0</text>{T('u', 190, 40, 24, 24)}{T('nu', 214, 40, 24, 24)}<text x="214" y="96" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">1 + (−1) = 0</text></Mini> },
  { t: 'Cek Solusi dan Poin Arsitek', p: 'Tekan Cek Solusi bila yakin. Pesan di layar membantu bila masih ada yang kurang. Bila benar, kawasan menjadi hidup, Poin Arsitek bertambah, dan sektor berikutnya mendekati terbuka. Tombol Petunjuk bertahap tersedia, tiap petunjuk mengurangi 10 poin.',
    d: <Mini>{T('x2', 100, 30, 50, 50)}{T('x', 150, 30, 16, 50)}{T('x', 100, 80, 50, 16)}{T('u', 150, 80, 16, 16)}<text x="125" y="112" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--leaf)">Kawasan berdiri!</text></Mini> },
];
export function Help({ onClose }) {
  const [i, setI] = useState(0);
  const s = HELP[i];
  return (
    <Modal title="Petunjuk Penggunaan" onClose={onClose}>
      <div className="grid gap-3">
        <div aria-live="polite" className="grid gap-3">
          <div className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Langkah {i + 1} dari {HELP.length}</div>
          <h3 className="text-xl font-extrabold">{s.t}</h3>
          {s.d}
          <p className="m-0">{s.p}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button className="btn btn-sm" disabled={i === 0} onClick={() => setI(i - 1)}>Sebelumnya</button>
          <div className="flex gap-1.5" aria-hidden="true">{HELP.map((_, k) => <span key={k} style={{ width: 9, height: 9, borderRadius: 9, background: k === i ? 'var(--accent)' : 'var(--line)' }} />)}</div>
          {i < HELP.length - 1 ? <button className="btn btn-sm btn-brand" onClick={() => setI(i + 1)}>Berikutnya</button> : <button className="btn btn-sm btn-primary" onClick={onClose}>Mengerti</button>}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Profil pengembang ---------- */
export function Dev({ onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText('081334589856'); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) { /* nomor tetap tampil sebagai teks */ }
  };
  return (
    <Modal title="Profil Pengembang" onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr] items-start">
        <img src={IMG.dev} alt="Foto Nanda Dila Zahrotul Khumainah" className="rounded-2xl w-full" style={{ aspectRatio: '1/1.1', objectFit: 'cover', objectPosition: 'center top' }} />
        <div className="grid gap-2 min-w-0">
          <h3 className="text-2xl font-extrabold">Nanda Dila Zahrotul Khumainah</h3>
          <dl className="m-0 grid gap-1">
            <div><dt className="text-sm font-bold" style={{ color: 'var(--muted)' }}>NIM</dt><dd className="m-0 font-semibold">250311844385</dd></div>
            <div><dt className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Program</dt><dd className="m-0 font-semibold">Mahasiswa S2 Pendidikan Matematika, Universitas Negeri Malang</dd></div>
            <div><dt className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Contact Person</dt><dd className="m-0 font-semibold flex flex-wrap items-center gap-2"><span style={{ userSelect: 'all' }}>081334589856</span><button className="btn btn-sm" onClick={copy}>{copied ? 'Tersalin' : 'Salin nomor'}</button></dd></div>
          </dl>
          <div className="rounded-xl p-2 bg-white self-start mt-1"><img src={IMG.logo} alt="Logo Universitas Negeri Malang" width="170" style={{ display: 'block' }} /></div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Buku proyek ---------- */
export function Book({ save, onClose }) {
  const items = Object.entries(save.book).sort((a, b) => { const [s1, n1] = a[0].split('-').map(Number), [s2, n2] = b[0].split('-').map(Number); return s1 - s2 || n1 - n2; });
  return (
    <Modal title="Buku Proyek" onClose={onClose}>
      {!items.length ? <p className="m-0" style={{ color: 'var(--muted)' }}>Belum ada catatan. Selesaikan misi pertama di Sektor 1 dan faktornya akan tercatat di sini.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--line)' }}><th className="py-2 pr-3">Misi</th><th className="py-2 pr-3">Persamaan</th><th className="py-2 pr-3">Faktor</th><th className="py-2">Akar</th></tr></thead>
          <tbody>{items.map(([k, v]) => {
            const [s, n] = k.split('-').map(Number);
            const m = MISSIONS[s][n - 1];
            return (<tr key={k} style={{ borderBottom: '1px solid var(--line)' }}>
              <td className="py-2 pr-3 whitespace-nowrap">S{s} · {n}</td>
              <td className="py-2 pr-3"><Eq a={m.a} b={m.b} c={m.c} zero={s === 4} /></td>
              <td className="py-2 pr-3"><Fac f={v.f} square={s === 3} /></td>
              <td className="py-2">{v.roots ? v.roots.map((r, i) => <span key={i}>{i ? ' atau ' : ''}x = <Frac num={r.num} den={r.den} /></span>) : '-'}</td>
            </tr>);
          })}</tbody></table></div>
      )}
    </Modal>
  );
}

/* ---------- Rekap guru ---------- */
export function Teacher({ onBack }) {
  const [token, setToken] = useState('');
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('points');
  const load = async (e) => {
    if (e) e.preventDefault();
    setBusy(true); setErr('');
    try { setRows(await fetchRows(token.trim())); } catch (x) { setRows(null); setErr(x.message === 'forbidden' ? 'Kode guru salah.' : 'Data belum bisa dimuat. Periksa koneksi dan alamat Apps Script.'); }
    setBusy(false);
  };
  const list = (rows || []).filter((r) => (r.name + ' ' + r.klass + ' ' + r.school).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'klass' ? String(a.klass || '').localeCompare(String(b.klass || '')) || a.name.localeCompare(b.name) : sort === 'recent' ? String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) : b.points - a.points);
  const csv = () => {
    const head = ['Nama', 'Kelas', 'Sekolah', 'Poin', 'Sektor 1', 'Sektor 2', 'Sektor 3', 'Sektor 4', 'Terakhir aktif'];
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const body = list.map((r) => [r.name, r.klass, r.school, r.points, ...r.n.map((n) => n + '/15'), r.updatedAt || ''].map(esc).join(','));
    const blob = new Blob(['\ufeff' + [head.map(esc).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'rekap-e-gatra.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const when = (iso) => { try { return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ''; } };
  return (
    <div className="wrap grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="display text-3xl font-extrabold" style={{ color: 'var(--brand)' }}>Rekap Guru</h1><p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>Progres siswa dari Google Sheets milikmu.</p></div>
        <div className="flex gap-2"><button className="btn btn-sm" onClick={csv} disabled={!list.length}>Unduh CSV</button><button className="btn btn-sm" onClick={onBack}>Kembali</button></div>
      </header>
      <form onSubmit={load} className="flex flex-wrap gap-3 items-end">
        <div className="field grow" style={{ maxWidth: 360 }}><label htmlFor="tk">Kode guru</label><input id="tk" className="input" type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" /></div>
        <button className="btn btn-brand" type="submit" disabled={busy || !token.trim()}>{rows ? 'Muat ulang' : 'Buka rekap'}</button>
      </form>
      {err && <p role="alert" className="m-0 p-3 rounded-xl font-semibold" style={{ background: 'var(--soft-warn)' }}>{err}</p>}
      {rows && (
        <>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="field grow" style={{ maxWidth: 360 }}><label htmlFor="tq">Cari nama, kelas, atau sekolah</label><input id="tq" className="input" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="field"><label htmlFor="ts">Urutkan</label><select id="ts" className="input" value={sort} onChange={(e) => setSort(e.target.value)}><option value="points">Poin tertinggi</option><option value="name">Nama</option><option value="klass">Kelas</option><option value="recent">Terbaru aktif</option></select></div>
            <span className="chip">{list.length} siswa</span>
          </div>
          {!rows.length && <p className="m-0 p-4 card" style={{ color: 'var(--muted)' }}>Belum ada data masuk. Data muncul setelah siswa menyelesaikan misi pertama.</p>}
          {list.length > 0 && (
            <div className="card overflow-x-auto"><table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: 760 }}>
              <thead><tr style={{ borderBottom: '2px solid var(--line)' }}>{['Nama', 'Kelas', 'Sekolah', 'Poin', 'S1', 'S2', 'S3', 'S4', 'Terakhir aktif'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
              <tbody>{list.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td className="p-3 font-semibold">{r.name}</td><td className="p-3">{r.klass}</td><td className="p-3">{r.school}</td>
                  <td className="p-3 eq font-bold">{r.points}</td>
                  {r.n.map((n, i) => <td key={i} className="p-3 eq">{n}/15</td>)}
                  <td className="p-3 text-sm">{when(r.updatedAt)}</td>
                </tr>))}</tbody></table></div>
          )}
        </>
      )}
    </div>
  );
}
