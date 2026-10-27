import React, { useEffect } from 'react';
import { polyStr, rootOf } from './logic.js';

import logo from './assets/logo.png';
import dev from './assets/dev.jpg';

export const IMG = { logo, dev };

export function Eq({ a, b, c, zero, lengkapi }) {
  const ts = [];
  if (a) ts.push({ co: a, v: 'x2' });
  if (b) ts.push({ co: b, v: 'x' });
  if (c && !lengkapi) ts.push({ co: c, v: '' });
  return (
    <span className="eq">
      {ts.map((t, i) => {
        const abs = Math.abs(t.co);
        const coef = t.v && abs === 1 ? '' : abs;
        const body = t.v === 'x2' ? <>{coef}x<sup>2</sup></> : t.v === 'x' ? <>{coef}x</> : <>{abs}</>;
        return <React.Fragment key={i}>{i === 0 ? (t.co < 0 ? '−' : '') : t.co < 0 ? ' − ' : ' + '}{body}</React.Fragment>;
      })}
      {lengkapi && ' + …'}
      {zero && ' = 0'}
    </span>
  );
}
export function eqText(a, b, c, zero) {
  let s = '';
  const add = (co, v) => {
    if (!co) return;
    const abs = Math.abs(co), coef = v && abs === 1 ? '' : abs;
    s += (s ? (co < 0 ? ' − ' : ' + ') : co < 0 ? '−' : '') + coef + v;
  };
  add(a, 'x²'); add(b, 'x'); add(c, '');
  return s + (zero ? ' = 0' : '');
}
export function Fac({ f, square }) {
  if (square) return <span className="eq">({polyStr(f.p, f.m)})<sup>2</sup></span>;
  return <span className="eq">({polyStr(f.p, f.m)})({polyStr(f.q, f.n)})</span>;
}
export function facText(f, square) {
  return square ? `(${polyStr(f.p, f.m)})²` : `(${polyStr(f.p, f.m)})(${polyStr(f.q, f.n)})`;
}
export function Frac({ num, den }) {
  const neg = num < 0;
  const n = Math.abs(num);
  if (den === 1) return <span className="eq">{neg ? '−' : ''}{n}</span>;
  return <span className="eq">{neg ? '−' : ''}<span className="frac"><span>{n}</span><span>{den}</span></span></span>;
}
export function Root({ p, m }) {
  const r = rootOf(p, m);
  return <Frac num={r.num} den={r.den} />;
}

export function Modal({ title, onClose, children, wide, label }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal card" role="dialog" aria-modal="true" aria-label={label || title} style={wide ? { width: 'min(860px,100%)' } : null}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <button className="btn btn-sm" onClick={onClose} aria-label="Tutup">Tutup</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Icon = {
  lock: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="currentColor" fillOpacity=".15" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>),
  book: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5V21.5" /><path d="M9 7.5h7" /></svg>),
  user: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>),
  help: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9.5" /><path d="M9.2 9.3a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1-1.4 2" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></svg>),
  star: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}><path d="m12 2.8 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.7 6.4 19.8l1.3-6.2L3 9.3l6.3-.7z" /></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12.5 4.5 4.5L19 7" /></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 5l-7 7 7 7" /></svg>),
  rotate: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></svg>),
  bulb: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" /></svg>),
};
