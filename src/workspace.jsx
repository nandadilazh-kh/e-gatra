import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TileArt, NAMES, SECTOR_NAMES } from './art.jsx';
import {
  GEO, val, dims, baseOf, isNeg, snap, checkPlacement, evaluate, fits, KEYS, baseTotals, remaining, clearZone,
  polyStr, rootOf, hintText, MISSIONS, SECTORS, eq as peq,
} from './logic.js';
import { Eq, Fac, facText, Frac, Modal, Icon, eqText } from './ui.jsx';

const U = GEO.u;
const pos = (t, x) => ({ x: GEO.ox + val(t.X, x) * U, y: GEO.oy + val(t.Y, x) * U });
const size = (t, x) => { const d = dims(t); return { w: val(d.w, x) * U, h: val(d.h, x) * U }; };

function Toast({ t }) {
  if (!t) return null;
  return <div className={`toast ${t.kind}`} role="status" aria-live="polite">{t.text}</div>;
}

function trayName(k, sector, view) {
  if (view === 'alg') return NAMES[k].alg;
  return (sector === 4 && SECTOR_NAMES[4][k]) || NAMES[k].city;
}

/* ---------- Layar kemenangan ---------- */
function Victory({ data, onClose, onNext, onRetry, hasNext }) {
  const { tiles, x, sector, mission, ev, score, unlocked, roots, total } = data;
  const box = useMemo(() => {
    let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0;
    tiles.forEach((t) => { const p = pos(t, x), s = size(t, x); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + s.w); y1 = Math.max(y1, p.y + s.h); });
    return { x0: x0 - 16, y0: y0 - 16, w: x1 - x0 + 32, h: y1 - y0 + 32 };
  }, [tiles, x]);
  const f = { p: ev.W.p, m: ev.W.m, q: ev.H.q, n: ev.H.n };
  const conf = useMemo(() => Array.from({ length: 36 }, (_, i) => ({ left: `${(i * 97) % 100}%`, dur: 3.2 + ((i * 13) % 30) / 10, delay: ((i * 7) % 20) / 10, c: ['#e0661a', '#2b8a57', '#2b8fc9', '#f0b429', '#d6529a'][i % 5] })), []);
  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Kawasan berhasil dibangun">
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {conf.map((c, i) => <span key={i} className="confetti" style={{ left: c.left, background: c.c, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }} />)}
      </div>
      <div className="modal card" style={{ position: 'relative', width: 'min(720px,100%)' }}>
        <h2 className="display text-3xl font-extrabold" style={{ color: 'var(--leaf)' }}>Kawasan berdiri!</h2>
        <p className="m-0 mb-2" style={{ color: 'var(--muted)' }}>Misi {mission.no} Sektor {sector}: {SECTORS[sector].name}</p>
        <div className="rounded-2xl overflow-hidden mb-3" style={{ background: 'var(--cv-bg)', border: '2px solid var(--cv-frame)' }}>
          <svg viewBox={`${box.x0} ${box.y0} ${box.w} ${box.h}`} className="block w-full h-auto" style={{ maxHeight: 300 }} role="img" aria-label="Denah yang sudah jadi kawasan hidup">
            {tiles.map((t) => { const p = pos(t, x), s = size(t, x); return <g key={t.id} transform={`translate(${p.x},${p.y})`}><TileArt k={t.key} w={s.w} h={s.h} view="city" sector={sector} alive /></g>; })}
            <g className="walker" style={{ '--dist': `${box.w - 60}px` }}><circle cx={box.x0 + 20} cy={box.y0 + box.h - 7} r="5" fill="#e0661a" /><circle cx={box.x0 + 20} cy={box.y0 + box.h - 15} r="3.4" fill="#f2c9a1" /></g>
          </svg>
        </div>
        <div className="grid gap-2 mb-3">
          <div className="display text-2xl font-extrabold"><Eq a={mission.a} b={mission.b} c={mission.c} zero={sector === 4} /> = <Fac f={f} square={sector === 3} />{sector === 4 ? ' = 0' : ''}</div>
          {roots && <div className="text-lg">Akar: {roots.map((r, i) => <span key={i}>{i ? ' atau ' : ''}x = <Frac num={r.num} den={r.den} /></span>)}. Dicatat di Buku Proyek.</div>}
          <div className="flex flex-wrap gap-2">
            <span className="chip" style={{ background: 'var(--soft-warn)' }}><Icon.star style={{ color: 'var(--sun)' }} /> +{score} Poin Arsitek</span>
            <span className="chip">Total {total} poin</span>
          </div>
          {unlocked && <p className="m-0 p-3 rounded-xl font-bold" style={{ background: 'var(--soft-ok)' }}>Gerbang Sektor {unlocked} terbuka! {SECTORS[unlocked].name} siap dibangun.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasNext && <button className="btn btn-primary" onClick={onNext}>Misi berikutnya</button>}
          <button className="btn btn-brand" onClick={onClose}>Peta Wilayah</button>
          <button className="btn" onClick={onRetry}>Ulangi misi</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Area kerja ---------- */
export default function Workspace({ sector, mission, lengkapi, save, onExit, onWin, onNext, onRetry }) {
  const [totals, setTotals] = useState(() => baseTotals(mission, lengkapi));
  const [tiles, setTiles] = useState([]);
  const [xv, setXv] = useState(3);
  const [view, setView] = useState('city');
  const [sel, setSel] = useState(null);
  const [trayRot, setTrayRot] = useState({ x: false, nx: false });
  const [drag, setDrag] = useState(null);
  const [toast, setToast] = useState(null);
  const [pairs, setPairs] = useState({ x: 0, u: 0 });
  const [hint, setHint] = useState({ used: 0, text: '' });
  const [flash, setFlash] = useState(null);
  const [win, setWin] = useState(null);
  const [rootsOpen, setRootsOpen] = useState(false);
  const [seen, setSeen] = useState(() => new Set());
  const idRef = useRef(1);
  const svgRef = useRef(null);
  const trayRef = useRef(null);
  const toastT = useRef(null);
  const S = useRef({});

  const rem = useMemo(() => remaining(totals, tiles), [totals, tiles]);
  const ev = useMemo(() => evaluate(tiles), [tiles]);
  const left = KEYS.some((k) => Number.isFinite(rem[k]) && rem[k] > 0);
  const valid = ev.status === 'rect' && !left && (sector !== 3 || ev.square) && (!lengkapi || ev.square);
  const f = valid ? { p: ev.W.p, m: ev.W.m, q: ev.H.q, n: ev.H.n } : null;
  S.current = { tiles, xv, drag, sel, rem, trayRot, totals };

  const say = (text, kind = 'info', ms = 3600) => {
    setToast({ text, kind });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), ms);
  };
  useEffect(() => () => clearTimeout(toastT.current), []);

  const scale = () => svgRef.current.getBoundingClientRect().width / GEO.W;

  /* --- seret --- */
  const startTray = (e, key) => {
    if (!(rem[key] > 0)) return;
    e.preventDefault();
    const rot = (key === 'x' || key === 'nx') ? !!trayRot[key] : false;
    const d = dims({ key, rot }), s = scale();
    setSel(null);
    setDrag({ src: 'tray', key, rot, cx: e.clientX, cy: e.clientY, startX: e.clientX, startY: e.clientY, offx: (val(d.w, xv) * U * s) / 2, offy: (val(d.h, xv) * U * s) / 2, active: true });
  };
  const startTile = (e, t) => {
    e.preventDefault(); e.stopPropagation();
    const r = svgRef.current.getBoundingClientRect(), s = r.width / GEO.W, p = pos(t, xv);
    setDrag({ src: 'canvas', id: t.id, key: t.key, rot: !!t.rot, cx: e.clientX, cy: e.clientY, startX: e.clientX, startY: e.clientY, offx: e.clientX - (r.left + p.x * s), offy: e.clientY - (r.top + p.y * s), active: false });
  };
  const dragOn = !!drag;
  useEffect(() => {
    if (!dragOn) return undefined;
    const move = (e) => setDrag((d) => (d ? { ...d, cx: e.clientX, cy: e.clientY, active: d.active || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5 } : d));
    const up = (e) => finish(e.clientX, e.clientY);
    const cancel = () => setDrag(null);
    const key = (e) => { if ((e.key === 'r' || e.key === 'R') && S.current.drag && baseOf(S.current.drag.key) === 'x') setDrag((d) => ({ ...d, rot: !d.rot })); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); window.removeEventListener('keydown', key); };
  }, [dragOn]);

  const dropTarget = (d, cx, cy) => {
    const r = svgRef.current.getBoundingClientRect(), s = r.width / GEO.W;
    const over = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    const dx = (cx - d.offx - r.left) / s, dy = (cy - d.offy - r.top) / s;
    return { over, dx, dy };
  };
  const finish = (cx, cy) => {
    const { drag: d, tiles: ts, xv: x } = S.current;
    setDrag(null);
    if (!d) return;
    const moved = d.src === 'tray' || Math.hypot(cx - d.startX, cy - d.startY) > 5;
    if (!moved) { setSel((s) => (s === d.id ? null : d.id)); return; }
    const { over, dx, dy } = dropTarget(d, cx, cy);
    if (!over) {
      if (d.src === 'canvas' && trayRef.current) {
        const tr = trayRef.current.getBoundingClientRect();
        if (cx >= tr.left && cx <= tr.right && cy >= tr.top && cy <= tr.bottom) { setTiles((a) => a.filter((t) => t.id !== d.id)); setSel(null); }
      }
      return;
    }
    const others = ts.filter((t) => t.id !== d.id);
    const res = snap({ key: d.key, rot: d.rot }, others, x, dx, dy);
    if (res.ok) {
      if (d.src === 'canvas') setTiles((a) => a.map((t) => (t.id === d.id ? { ...t, rot: d.rot, X: res.X, Y: res.Y } : t)));
      else { const id = idRef.current++; setTiles((a) => [...a, { id, key: d.key, rot: d.rot, X: res.X, Y: res.Y }]); setSeen((s) => new Set(s).add(id)); }
      return;
    }
    if (res.X) setFlash({ key: Date.now(), t: { key: d.key, rot: d.rot, X: res.X, Y: res.Y } });
    setTimeout(() => setFlash(null), 900);
    if (res.reason === 'mismatch') say('Sisi ubin belum cocok. Sisi x menempel pada sisi x, dan sisi 1 pada sisi 1.', 'warn');
    else if (res.reason === 'far') say('Letakkan ubin lebih dekat ke susunan supaya bisa menempel.', 'info');
    else say('Ubin belum bisa diletakkan di sini. Coba posisi lain.', 'info');
  };

  /* --- aksi toolbar --- */
  const removeSel = () => { if (sel == null) return; setTiles((a) => a.filter((t) => t.id !== sel)); setSel(null); };
  const rotateSel = () => {
    const t = tiles.find((q) => q.id === sel);
    if (!t) { say('Pilih dulu ubin jalan setapak atau parit di kanvas.', 'info'); return; }
    if (baseOf(t.key) !== 'x') { say('Hanya jalan setapak dan parit yang bisa diputar.', 'info'); return; }
    const nt = { ...t, rot: !t.rot };
    const c = checkPlacement(nt, tiles.filter((q) => q.id !== t.id), xv);
    if (c.ok) setTiles((a) => a.map((q) => (q.id === t.id ? nt : q)));
    else say('Ubin belum muat bila diputar di sini. Pindahkan dulu, atau putar dari tray sebelum menyeret.', 'info');
  };
  useEffect(() => {
    const k = (e) => {
      if (S.current.drag || /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === 'r' || e.key === 'R') rotateSel();
      if (e.key === 'Delete' || e.key === 'Backspace') removeSel();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const reset = () => { setTiles([]); setTotals(baseTotals(mission, lengkapi)); setPairs({ x: 0, u: 0 }); setSel(null); setHint((h) => ({ ...h, text: '' })); setFlash(null); say('Kanvas dikosongkan. Poinmu tidak berkurang.', 'info', 2200); };
  const setX = (v) => {
    if (!fits(tiles, v)) { say('Kanvas belum cukup luas untuk ukuran x sebesar itu. Kecilkan sedikit nilai x.', 'info'); return; }
    setXv(v);
  };
  const addPair = (kind) => {
    if (pairs[kind] >= 8) { say('Cukup banyak pasangan nol. Pakai dulu yang sudah ada.', 'info'); return; }
    const [a, b] = kind === 'x' ? ['x', 'nx'] : ['u', 'nu'];
    setTotals((t) => ({ ...t, [a]: t[a] + 1, [b]: t[b] + 1 }));
    setPairs((p) => ({ ...p, [kind]: p[kind] + 1 }));
    say(kind === 'x' ? 'Pasangan nol ditambahkan: satu jalan setapak dan satu parit.' : 'Pasangan nol ditambahkan: satu petak bunga dan satu kolam mini.', 'ok', 2600);
  };
  const clearPairs = () => {
    const used = clearZone(tiles);
    if (!used.size) { say('Belum ada pasangan berlawanan yang saling bersentuhan.', 'info'); return; }
    const gone = tiles.filter((_, i) => used.has(i));
    setTiles(tiles.filter((_, i) => !used.has(i)));
    setTotals((t) => { const n = { ...t }; gone.forEach((g) => { n[g.key] -= 1; }); return n; });
    setSel(null);
    say(`${used.size / 2} pasangan nol dibersihkan dari zona.`, 'ok', 2600);
  };
  const useHint = () => {
    const level = Math.min(3, hint.used + 1);
    let text = hintText(mission, level);
    if (level === 3) {
      const m = mission.f;
      if (!tiles.length && rem.x2 >= m.p * m.q) {
        const add = [];
        for (let j = 0; j < m.q; j++) for (let i = 0; i < m.p; i++) add.push({ id: idRef.current++, key: 'x2', rot: false, X: [i, 1], Y: [j, 1] });
        setTiles(add);
      } else text = hintText(mission, 2);
    }
    setHint({ used: Math.max(hint.used, level), text });
  };

  const check = () => {
    if (left || ev.status === 'empty') {
      const pairLeft = (pairs.x > 0 && (rem.x > 0 || rem.nx > 0)) || (pairs.u > 0 && (rem.u > 0 || rem.nu > 0));
      say(pairLeft ? 'Pasangan nol belum terpakai. Coba gunakan di tata ruangmu.' : 'Masih ada bahan yang belum dipakai.', 'warn'); return;
    }
    if (ev.status === 'gap') {
      setFlash({ key: Date.now(), gaps: ev.gaps, ev });
      setTimeout(() => setFlash(null), 2800);
      say('Ada petak lahan kosong. Coba atur ulang jalan setapaknya.', 'warn'); return;
    }
    if (ev.status === 'sign') { say('Susunan sudah rapat, tetapi tanda ubin belum serasi. Coba tukar posisi jalan dan parit atau kolam.', 'warn'); return; }
    if ((sector === 3 || lengkapi) && !ev.square) { say('Alun-alun belum simetris. Samakan panjang dan lebarnya.', 'warn'); return; }
    const ff = { p: ev.W.p, m: ev.W.m, q: ev.H.q, n: ev.H.n };
    const score = Math.max(50, 100 - 10 * hint.used);
    const info = onWin({ sector, no: mission.no, score, f: ff, roots: sector === 4 ? [rootOf(ff.p, ff.m), rootOf(ff.q, ff.n)] : null });
    setSel(null);
    setWin({ tiles, x: xv, sector, mission, ev, score, unlocked: info.unlocked, roots: sector === 4 ? [rootOf(ff.p, ff.m), rootOf(ff.q, ff.n)] : null, total: info.total });
  };
  const recordRoots = () => {
    onWin({ sector, no: mission.no, score: 0, f, roots: [rootOf(f.p, f.m), rootOf(f.q, f.n)], rootsOnly: true });
    say('Akar dicatat di Buku Proyek.', 'ok', 2600);
  };

  /* --- render --- */
  const preview = useMemo(() => {
    if (!drag || !drag.active || !svgRef.current) return null;
    const { over, dx, dy } = dropTarget(drag, drag.cx, drag.cy);
    if (!over) return null;
    const others = tiles.filter((t) => t.id !== drag.id);
    const res = snap({ key: drag.key, rot: drag.rot }, others, xv, dx, dy);
    return res.X ? { t: { key: drag.key, rot: drag.rot, X: res.X, Y: res.Y }, ok: res.ok } : null;
  }, [drag, tiles, xv]);

  const area = mission.a * xv * xv + mission.b * xv + mission.c;
  const dimW = f ? f.p * xv + f.m : 0, dimH = f ? f.q * xv + f.n : 0;
  const hasNext = mission.no < 15;
  const showPairs = sector >= 2;
  const trayKeys = ['x2', 'x', 'u', 'nx', 'nu'].filter((k) => Number.isFinite(totals[k]) ? totals[k] > 0 : true).filter((k) => !(lengkapi && k === 'nu'));
  const sc = svgRef.current ? scale() : 1;

  return (
    <div className="wrap grid gap-3">
      <header className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button className="btn btn-sm" onClick={onExit}><Icon.back /> Back</button>
          <div className="min-w-0">
            <div className="text-sm font-bold" style={{ color: 'var(--muted)' }}>Sektor {sector} · {SECTORS[sector].name} · Misi {mission.no}/15</div>
            <div className="display text-2xl font-extrabold leading-tight">Target luas: <Eq a={mission.a} b={mission.b} c={mission.c} zero={sector === 4} lengkapi={lengkapi} /></div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="chip" title="Luas bersih pada nilai x sekarang">x = {xv} m · luas bersih {lengkapi ? '…' : `${area} m²`}</span>
          <button className="btn btn-sm" onClick={useHint} disabled={hint.used >= 3 && !!hint.text}><Icon.bulb /> Petunjuk{hint.used < 3 ? ' (−10 poin)' : ''}</button>
        </div>
      </header>

      {hint.text && <p role="status" className="m-0 p-3 rounded-xl font-semibold flex items-start gap-2" style={{ background: 'var(--soft-info)' }}><Icon.bulb style={{ flex: 'none', marginTop: 3 }} /><span>{hint.text}</span></p>}

      <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside ref={trayRef} aria-label="Inventory Tray" className="card p-3 grid gap-2 content-start" style={{ borderRadius: 18 }}>
          <h2 className="display text-lg font-extrabold">Inventory Tray</h2>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
            {trayKeys.map((k) => {
              const n = rem[k], inf = n === Infinity, empty = !inf && n <= 0;
              const b = baseOf(k), rot = (k === 'x' || k === 'nx') && trayRot[k];
              const tw = b === 'x2' ? 48 : b === 'x' ? (rot ? 16 : 48) : 16, th = b === 'x2' ? 48 : b === 'x' ? (rot ? 48 : 16) : 16;
              return (
                <div key={k} className="tray-item" data-empty={empty} onPointerDown={(e) => startTray(e, k)} aria-label={`${trayName(k, sector, view)}, sisa ${inf ? 'tak terbatas' : n}`}>
                  <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true" style={{ flex: 'none' }}><g transform={`translate(${(52 - tw) / 2},${(52 - th) / 2})`}><TileArt k={k} w={tw} h={th} view={view} sector={sector} /></g></svg>
                  <div className="min-w-0 grow">
                    <div className="font-bold text-sm leading-tight">{trayName(k, sector, view)}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{['x2', 'x', 'u', 'nx', 'nu'].includes(k) ? { x2: 'x × x', x: 'x × 1', u: '1 × 1', nx: '−x', nu: '−1' }[k] : ''}</div>
                    {(k === 'x' || k === 'nx') && <button className="btn btn-sm mt-1" style={{ minHeight: 28, padding: '0 8px' }} onPointerDown={(e) => e.stopPropagation()} onClick={() => setTrayRot((r) => ({ ...r, [k]: !r[k] }))} aria-label={`Putar ${trayName(k, sector, view)} di tray`}><Icon.rotate /> Putar</button>}
                  </div>
                  <span className="badge" aria-hidden="true">{inf ? '∞' : n}</span>
                </div>
              );
            })}
          </div>
          {!left && tiles.length > 0 && <p className="m-0 text-sm font-semibold" style={{ color: 'var(--leaf)' }}>Semua bahan sudah dipakai.</p>}
        </aside>

        <section className="min-w-0 grid gap-2">
          <div className="canvas-wrap">
            <svg ref={svgRef} className="canvas-svg" viewBox={`0 0 ${GEO.W} ${GEO.H}`} role="application" aria-label="Grid Canvas cetak biru"
              onPointerDown={() => setSel(null)}>
              <defs><pattern id="cvgrid" x={GEO.ox} y={GEO.oy} width={U} height={U} patternUnits="userSpaceOnUse"><path d={`M${U},0 H0 V${U}`} fill="none" stroke="var(--cv-grid)" strokeWidth="1" /></pattern></defs>
              <rect width={GEO.W} height={GEO.H} fill="var(--cv-bg)" />
              <rect width={GEO.W} height={GEO.H} fill="url(#cvgrid)" />
              <text x={GEO.W - 14} y={GEO.H - 12} textAnchor="end" fontSize="13" fontWeight="700" fill="var(--muted)">Skala: 1 kotak = 1 m · x = {xv} m</text>

              {flash && flash.gaps && flash.gaps.map((g, i) => {
                const e2 = flash.ev;
                const x0 = GEO.ox + val(e2.xs[g.i], xv) * U, x1 = GEO.ox + val(e2.xs[g.i + 1], xv) * U;
                const y0 = GEO.oy + val(e2.ys[g.j], xv) * U, y1 = GEO.oy + val(e2.ys[g.j + 1], xv) * U;
                return <rect key={i} className="pulse" x={x0 + 2} y={y0 + 2} width={x1 - x0 - 4} height={y1 - y0 - 4} rx="4" fill="var(--sun)" fillOpacity=".35" stroke="var(--sun)" strokeWidth="2.5" strokeDasharray="6 4" />;
              })}

              {tiles.map((t) => {
                const p = pos(t, xv), s = size(t, xv);
                const ghosted = drag && drag.active && drag.src === 'canvas' && drag.id === t.id;
                return (
                  <g key={t.id} className="tile-g" transform={`translate(${p.x},${p.y})`} opacity={ghosted ? 0.25 : 1} onPointerDown={(e) => startTile(e, t)}>
                    <g className={seen.has(t.id) ? 'tile-in' : ''}><TileArt k={t.key} w={s.w} h={s.h} view={view} sector={sector} /></g>
                    {sel === t.id && <rect x="-2" y="-2" width={s.w + 4} height={s.h + 4} rx="5" fill="none" stroke="var(--accent)" strokeWidth="3.5" />}
                  </g>
                );
              })}

              {preview && (() => { const p = pos(preview.t, xv), s = size(preview.t, xv); return <rect x={p.x} y={p.y} width={s.w} height={s.h} rx="4" fill={preview.ok ? 'var(--leaf)' : 'var(--sun)'} fillOpacity=".22" stroke={preview.ok ? 'var(--leaf)' : 'var(--sun)'} strokeWidth="3" strokeDasharray={preview.ok ? undefined : '7 5'} pointerEvents="none" />; })()}
              {flash && flash.t && (() => { const p = pos(flash.t, xv), s = size(flash.t, xv); return <rect className="pulse" x={p.x} y={p.y} width={s.w} height={s.h} rx="4" fill="var(--sun)" fillOpacity=".3" stroke="var(--sun)" strokeWidth="3" strokeDasharray="7 5" pointerEvents="none" />; })()}

              {valid && (() => {
                const x0 = GEO.ox + val(ev.box.x0, xv) * U, x1 = GEO.ox + val(ev.box.x1, xv) * U;
                const y0 = GEO.oy + val(ev.box.y0, xv) * U, y1 = GEO.oy + val(ev.box.y1, xv) * U;
                const sq = sector === 3;
                const topT = `${sq ? 'Sisi' : 'Panjang'} = (${polyStr(ev.W.p, ev.W.m)})`, sideT = `${sq ? 'Sisi' : 'Lebar'} = (${polyStr(ev.H.q, ev.H.n)})`;
                const lab = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, fill: 'var(--ink)' };
                return (
                  <g pointerEvents="none">
                    <path d={`M${x0},${y0 - 12} H${x1} M${x0},${y0 - 18} V${y0 - 6} M${x1},${y0 - 18} V${y0 - 6}`} stroke="var(--ink)" strokeWidth="2" fill="none" />
                    <text x={(x0 + x1) / 2} y={y0 - 22} textAnchor="middle" style={lab}>{topT}</text>
                    <path d={`M${x0 - 12},${y0} V${y1} M${x0 - 18},${y0} H${x0 - 6} M${x0 - 18},${y1} H${x0 - 6}`} stroke="var(--ink)" strokeWidth="2" fill="none" />
                    <text transform={`translate(${x0 - 22},${(y0 + y1) / 2}) rotate(-90)`} textAnchor="middle" style={lab}>{sideT}</text>
                  </g>
                );
              })()}
            </svg>
            {!tiles.length && <div className="absolute inset-0 grid place-items-center pointer-events-none"><p className="m-0 px-4 py-2 rounded-xl font-bold text-center" style={{ background: 'var(--surface)', border: '1.5px dashed var(--cv-frame)', color: 'var(--muted)' }}>Seret ubin dari tray ke kanvas ini</p></div>}
          </div>

          <div className="card p-3 grid gap-3" style={{ borderRadius: 18 }} role="toolbar" aria-label="Toolbar fitur">
            <div className="flex flex-wrap gap-x-5 gap-y-3 items-end">
              <div className="grid gap-1">
                <span className="text-sm font-bold">Tampilan</span>
                <div className="seg" role="group" aria-label="Mode tampilan">
                  <button aria-pressed={view === 'city'} onClick={() => setView('city')}>Mode Daerah</button>
                  <button aria-pressed={view === 'alg'} onClick={() => setView('alg')}>Mode Aljabar</button>
                </div>
              </div>
              <div className="grid gap-1 grow" style={{ minWidth: 190, maxWidth: 320 }}>
                <label htmlFor="xs" className="text-sm font-bold flex justify-between"><span>Nilai x</span><span className="eq">x = {xv} m</span></label>
                <input id="xs" type="range" min="2" max="6" step="1" value={xv} onChange={(e) => setX(Number(e.target.value))} aria-valuetext={`x sama dengan ${xv} meter`} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-sm" onClick={rotateSel} disabled={sel == null}><Icon.rotate /> Putar</button>
                <button className="btn btn-sm" onClick={removeSel} disabled={sel == null}>Kembalikan ke tray</button>
                <button className="btn btn-sm" onClick={reset}>Reset</button>
              </div>
            </div>
            {showPairs && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <span className="text-sm font-bold">Tambah Pasangan Nol:</span>
                <button className="btn btn-sm" onClick={() => addPair('x')}>+ x dan −x</button>
                <button className="btn btn-sm" onClick={() => addPair('u')}>+ 1 dan −1</button>
                <button className="btn btn-sm" onClick={clearPairs}>Bersihkan Zona</button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <div className="min-w-0 font-semibold" aria-live="polite">
                {valid
                  ? <span>Denah benar: <Fac f={f} square={sector === 3} />{!lengkapi && <> → ({dimW}) × ({dimH}) = {dimW * dimH} m² pada x = {xv}</>}</span>
                  : <span style={{ color: 'var(--muted)' }}>Label panjang dan lebar muncul saat denah utuh.</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {sector === 4 && <button className="btn" onClick={() => setRootsOpen(true)} disabled={!valid}>Cari Akar</button>}
                <button className="btn btn-primary" style={{ minHeight: 46, paddingInline: 22 }} onClick={check}>Cek Solusi</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {drag && drag.active && (() => {
        const d = dims({ key: drag.key, rot: drag.rot });
        const w = val(d.w, xv) * U * sc, h = val(d.h, xv) * U * sc;
        return <div className="ghost" style={{ left: drag.cx - drag.offx, top: drag.cy - drag.offy, width: w, height: h }}><svg width={w} height={h} viewBox={`0 0 ${w / sc} ${h / sc}`}><TileArt k={drag.key} w={w / sc} h={h / sc} view={view} sector={sector} /></svg></div>;
      })()}

      <Toast t={toast} />

      {rootsOpen && f && (
        <Modal title="Cari Akar" onClose={() => setRootsOpen(false)}>
          <div className="grid gap-3 text-lg">
            <div>Persamaan: <Eq a={mission.a} b={mission.b} c={mission.c} zero /></div>
            <div>Faktor dari denah: <Fac f={f} /> = 0</div>
            <div>Setiap faktor disamakan dengan nol:</div>
            <div className="grid gap-1 pl-3" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="eq">{polyStr(f.p, f.m)} = 0 → x = <Frac {...rootOf(f.p, f.m)} /></div>
              <div className="eq">{polyStr(f.q, f.n)} = 0 → x = <Frac {...rootOf(f.q, f.n)} /></div>
            </div>
            <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>Akar bisa negatif atau pecahan, jadi tidak selalu bisa digambar sebagai ukuran nyata di denah. Karena itu akar dicatat di Buku Proyek.</p>
            <button className="btn btn-brand" onClick={() => { recordRoots(); setRootsOpen(false); }}>Catat ke Buku Proyek</button>
          </div>
        </Modal>
      )}

      {win && <Victory data={win} hasNext={hasNext} onClose={onExit} onNext={onNext} onRetry={onRetry} />}
    </div>
  );
}
