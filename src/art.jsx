import React from 'react';
import { baseOf, isNeg } from './logic.js';

export const INK = '#12263f';

// Pola arsiran dipakai bersama oleh semua svg (id global).
export function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={INK} strokeWidth="2.4" opacity="0.5" />
        </pattern>
      </defs>
    </svg>
  );
}

const ALG = { x2: '#9fd0f2', x: '#f6cf74', u: '#a8dbb0', nx: '#f1b39b', nu: '#d6bff0' };
const LABEL = { x2: 'x²', x: 'x', u: '1', nx: '−x', nu: '−1' };

function AlgTile({ k, w, h }) {
  const m = Math.min(w, h);
  const fs = k === 'x2' ? Math.min(m * 0.42, 34) : Math.min(m * 0.56, 22);
  return (
    <g>
      <rect width={w} height={h} rx="3" fill={ALG[k]} />
      {isNeg(k) && <rect width={w} height={h} rx="3" fill="url(#hatch)" />}
      <rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="3" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray={isNeg(k) ? '5 3' : undefined} />
      <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight="800" fill={INK}
        style={{ fontFamily: 'var(--font-display)', paintOrder: 'stroke', stroke: isNeg(k) ? ALG[k] : 'none', strokeWidth: isNeg(k) ? 3 : 0 }}>
        {LABEL[k]}
      </text>
    </g>
  );
}

function Building({ w, h, sector, alive }) {
  const m = Math.min(w, h);
  if (sector === 1) {
    const slats = [];
    for (let i = 1; i < 7; i++) slats.push(<line key={i} x1={w * 0.08} x2={w * 0.92} y1={(h * i) / 7} y2={(h * i) / 7} stroke="#8f3b1f" strokeWidth="1" opacity=".5" />);
    return (
      <g>
        <rect width={w} height={h} rx="5" fill="#e9b793" />
        <rect x={w * 0.07} y={h * 0.07} width={w * 0.86} height={h * 0.86} rx="4" fill="#c4572f" />
        {slats}
        <line x1={w * 0.07} x2={w * 0.93} y1={h / 2} y2={h / 2} stroke="#7a2e14" strokeWidth="2.5" />
        <rect x={w * 0.68} y={h * 0.14} width={w * 0.1} height={h * 0.14} fill="#5a3022" />
        <rect x={w * 0.4} y={h * 0.82} width={w * 0.2} height={h * 0.1} rx="2" fill="#f6e3b4" />
        {alive && <circle className="smoke" cx={w * 0.73} cy={h * 0.14} r={m * 0.05} fill="#fff" opacity=".8" />}
      </g>
    );
  }
  if (sector === 2) {
    const stripes = [];
    const n = Math.max(4, Math.round(w / 12));
    for (let i = 0; i < n; i++) stripes.push(<rect key={i} x={(w * i) / n} y={h * 0.8} width={w / n} height={h * 0.2} fill={i % 2 ? '#fff6e6' : '#e0661a'} />);
    return (
      <g>
        <rect width={w} height={h} rx="5" fill="#7f9bbd" />
        <rect x={w * 0.07} y={h * 0.07} width={w * 0.86} height={h * 0.66} rx="3" fill="#b9cbe0" />
        <rect x={w * 0.14} y={h * 0.16} width={w * 0.22} height={h * 0.2} rx="2" fill="#6f879f" />
        <rect x={w * 0.44} y={h * 0.16} width={w * 0.22} height={h * 0.2} rx="2" fill="#6f879f" />
        <rect x={w * 0.14} y={h * 0.44} width={w * 0.5} height={h * 0.14} rx="2" fill="#f0b429" />
        <g clipPath="none">{stripes}</g>
        {alive && <rect className="alive-w" x={w * 0.14} y={h * 0.44} width={w * 0.5} height={h * 0.14} rx="2" fill="#fff4b8" opacity=".6" />}
      </g>
    );
  }
  if (sector === 3) {
    return (
      <g>
        <rect width={w} height={h} rx="5" fill="#e8dbbd" />
        <rect x={w * 0.05} y={h * 0.05} width={w * 0.9} height={h * 0.9} rx="4" fill="none" stroke="#c9b68a" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx={w / 2} cy={h / 2} r={m * 0.38} fill="#cdebf8" stroke="#2b8fc9" strokeWidth="2.5" />
        <circle className={alive ? 'alive-w' : ''} cx={w / 2} cy={h / 2} r={m * 0.24} fill="#72c3ea" />
        <circle cx={w / 2} cy={h / 2} r={m * 0.07} fill="#fff" />
      </g>
    );
  }
  const teeth = [];
  const n = 4;
  for (let i = 0; i < n; i++) teeth.push(<polygon key={i} points={`${(w * i) / n},${h * 0.62} ${(w * i) / n},${h * 0.32} ${(w * (i + 1)) / n},${h * 0.62}`} fill="#a7b1be" />);
  return (
    <g>
      <rect width={w} height={h} rx="5" fill="#6f7b8a" />
      <rect x={w * 0.06} y={h * 0.28} width={w * 0.88} height={h * 0.66} fill="#8d98a7" />
      {teeth}
      <rect x={w * 0.14} y={h * 0.74} width={w * 0.72} height={h * 0.12} fill="#4b5563" />
      <circle cx={w * 0.8} cy={h * 0.17} r={m * 0.09} fill="#3c4450" stroke="#d4581f" strokeWidth="3" />
      {alive && <circle className="smoke" cx={w * 0.8} cy={h * 0.14} r={m * 0.07} fill="#fff" opacity=".85" />}
    </g>
  );
}

function Path({ w, h, sector }) {
  const horiz = w >= h;
  const L = horiz ? w : h, T = horiz ? h : w;
  if (sector === 4) {
    const ties = [];
    const n = Math.max(3, Math.round(L / 9));
    for (let i = 0; i < n; i++) {
      const p = ((i + 0.5) * L) / n;
      ties.push(horiz ? <line key={i} x1={p} x2={p} y1={T * 0.1} y2={T * 0.9} stroke="#5b4636" strokeWidth="2.4" /> : <line key={i} y1={p} y2={p} x1={T * 0.1} x2={T * 0.9} stroke="#5b4636" strokeWidth="2.4" />);
    }
    return (
      <g>
        <rect width={w} height={h} rx="3" fill="#b3b8c0" />
        {ties}
        {horiz ? (<><line x1="0" x2={w} y1={T * 0.3} y2={T * 0.3} stroke="#3d4450" strokeWidth="2" /><line x1="0" x2={w} y1={T * 0.7} y2={T * 0.7} stroke="#3d4450" strokeWidth="2" /></>)
          : (<><line y1="0" y2={h} x1={T * 0.3} x2={T * 0.3} stroke="#3d4450" strokeWidth="2" /><line y1="0" y2={h} x1={T * 0.7} x2={T * 0.7} stroke="#3d4450" strokeWidth="2" /></>)}
      </g>
    );
  }
  const stones = [];
  const n = Math.max(3, Math.round(L / 14));
  for (let i = 0; i < n; i++) {
    const p = ((i + 0.5) * L) / n;
    stones.push(<circle key={i} cx={horiz ? p : T / 2} cy={horiz ? T / 2 : p} r={T * 0.14} fill="#cdb98a" />);
  }
  return (
    <g>
      <rect width={w} height={h} rx="3" fill="#efe2c2" />
      <rect x={horiz ? 0 : T * 0.12} y={horiz ? T * 0.12 : 0} width={horiz ? w : T * 0.76} height={horiz ? T * 0.76 : h} fill="none" stroke="#d9c79b" strokeWidth="1.2" />
      {stones}
    </g>
  );
}

function Flower({ w, h, sector }) {
  const m = Math.min(w, h), cx = w / 2, cy = h / 2, r = m * 0.17;
  if (sector === 4) {
    return (
      <g>
        <rect width={w} height={h} rx="3" fill="#c9cfd8" />
        <rect x={m * 0.14} y={m * 0.14} width={w - m * 0.28} height={h - m * 0.28} fill="none" stroke="#7d8794" strokeWidth="1.6" />
        <line x1={m * 0.14} y1={m * 0.14} x2={w - m * 0.14} y2={h - m * 0.14} stroke="#7d8794" strokeWidth="1.4" />
      </g>
    );
  }
  const petals = [0, 72, 144, 216, 288].map((a) => (
    <circle key={a} cx={cx + Math.cos((a * Math.PI) / 180) * r * 1.15} cy={cy + Math.sin((a * Math.PI) / 180) * r * 1.15} r={r} fill="#f48fb1" />
  ));
  return (
    <g>
      <rect width={w} height={h} rx="3" fill="#9bd7a2" />
      {petals}
      <circle cx={cx} cy={cy} r={r * 0.8} fill="#ffd54a" />
    </g>
  );
}

function Parit({ w, h }) {
  const horiz = w >= h;
  const L = horiz ? w : h, T = horiz ? h : w;
  const d = [];
  const n = Math.max(2, Math.round(L / 22));
  for (let i = 0; i < n; i++) {
    const p = (i * L) / n;
    d.push(horiz ? `M${p},${T * 0.5} q${L / n / 4},${-T * 0.22} ${L / n / 2},0 t${L / n / 2},0` : `M${T * 0.5},${p} q${-T * 0.22},${L / n / 4} 0,${L / n / 2} t0,${L / n / 2}`);
  }
  return (
    <g>
      <rect width={w} height={h} rx="3" fill="#7ec6ec" />
      <path d={d.join(' ')} fill="none" stroke="#e9f7ff" strokeWidth="2" strokeLinecap="round" className="alive-w" />
      <rect width={w} height={h} rx="3" fill="url(#hatch)" />
      <rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="3" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="5 3" />
    </g>
  );
}

function Kolam({ w, h }) {
  const m = Math.min(w, h);
  return (
    <g>
      <rect width={w} height={h} rx="3" fill="#bfe3f4" />
      <ellipse cx={w / 2} cy={h / 2} rx={w * 0.38} ry={h * 0.38} fill="#4aa3d8" className="alive-w" />
      <ellipse cx={w / 2} cy={h / 2} rx={m * 0.14} ry={m * 0.14} fill="none" stroke="#e9f7ff" strokeWidth="1.8" />
      <rect width={w} height={h} rx="3" fill="url(#hatch)" />
      <rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="3" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="5 3" />
    </g>
  );
}

// Satu ubin berukuran w×h piksel; titik (0,0) di pojok kiri atas.
export function TileArt({ k, w, h, view, sector = 1, alive = false }) {
  if (view === 'alg') return <AlgTile k={k} w={w} h={h} />;
  const b = baseOf(k);
  if (b === 'x2') return <g className={alive ? 'alive-b' : ''}><Building w={w} h={h} sector={sector} alive={alive} /><rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="4" fill="none" stroke={INK} strokeWidth="1.5" /></g>;
  if (k === 'x') return <g><Path w={w} h={h} sector={sector} /><rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="3" fill="none" stroke={INK} strokeWidth="1.2" /></g>;
  if (k === 'u') return <g className={alive ? 'alive-f' : ''}><Flower w={w} h={h} sector={sector} /><rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="3" fill="none" stroke={INK} strokeWidth="1.2" /></g>;
  if (k === 'nx') return <Parit w={w} h={h} />;
  return <Kolam w={w} h={h} />;
}

export const NAMES = {
  x2: { city: 'Bangunan Utama', alg: 'Ubin x²' },
  x: { city: 'Ruas Jalan Setapak', alg: 'Ubin x' },
  u: { city: 'Petak Bunga', alg: 'Ubin 1' },
  nx: { city: 'Parit Setapak', alg: 'Ubin −x' },
  nu: { city: 'Kolam Mini', alg: 'Ubin −1' },
};
export const SECTOR_NAMES = {
  4: { x2: 'Pabrik Utama', x: 'Jalur Rel', u: 'Modul Paving' },
};
