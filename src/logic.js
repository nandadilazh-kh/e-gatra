// Logika inti E-GATRA: koordinat simbolik a·x + b, penempatan ubin, validasi, bank misi.
// Posisi dan ukuran ditulis sebagai pasangan [ax, au] = ax·x + au. Urutan dibandingkan leksikografis (x dianggap besar).

export const X = [1, 0], ONE = [0, 1], ZERO = [0, 0];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmp = (a, b) => (a[0] !== b[0] ? Math.sign(a[0] - b[0]) : Math.sign(a[1] - b[1]));
export const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
export const val = (a, x) => a[0] * x + a[1];
const pmax = (a, b) => (cmp(a, b) >= 0 ? a : b);
const pmin = (a, b) => (cmp(a, b) <= 0 ? a : b);
const pkey = (a) => a[0] + ',' + a[1];

// Jenis ubin: 'x2' (bangunan), 'x' (jalan), 'u' (petak bunga), 'nx' (parit), 'nu' (kolam)
export const isNeg = (k) => k === 'nx' || k === 'nu';
export const baseOf = (k) => (k === 'x2' ? 'x2' : k === 'x' || k === 'nx' ? 'x' : 'u');

export function dims(t) {
  const b = baseOf(t.key);
  if (b === 'x2') return { w: X, h: X };
  if (b === 'x') return t.rot ? { w: ONE, h: X } : { w: X, h: ONE };
  return { w: ONE, h: ONE };
}
export function rectOf(t) {
  const d = dims(t);
  return { x0: t.X, y0: t.Y, x1: add(t.X, d.w), y1: add(t.Y, d.h) };
}
const overlaps = (a, b) =>
  cmp(a.x0, b.x1) < 0 && cmp(b.x0, a.x1) < 0 && cmp(a.y0, b.y1) < 0 && cmp(b.y0, a.y1) < 0;

// Kontak sisi. null = tidak menempel; {ok} = menempel, ok bila sisi sama panjang penuh.
export function contact(a, b) {
  let res = null;
  const side = (touch, lo, hi, la, lb) => {
    if (!touch) return;
    const len = sub(hi, lo);
    if (cmp(len, ZERO) > 0) {
      const ok = eq(len, la) && eq(len, lb);
      res = res ? { ok: res.ok && ok } : { ok };
    }
  };
  const ha = sub(a.y1, a.y0), hb = sub(b.y1, b.y0), wa = sub(a.x1, a.x0), wb = sub(b.x1, b.x0);
  const yLo = pmax(a.y0, b.y0), yHi = pmin(a.y1, b.y1);
  const xLo = pmax(a.x0, b.x0), xHi = pmin(a.x1, b.x1);
  side(eq(a.x1, b.x0) || eq(b.x1, a.x0), yLo, yHi, ha, hb);
  side(eq(a.y1, b.y0) || eq(b.y1, a.y0), xLo, xHi, wa, wb);
  return res;
}

export const GEO = { u: 32, ox: 32, oy: 32, W: 1000, H: 640 };
const px = (p, x, o) => o + val(p, x) * GEO.u;

export function inBounds(t, x) {
  const r = rectOf(t);
  if (cmp(r.x0, ONE) < 0 || cmp(r.y0, ONE) < 0) return false;
  return px(r.x1, x, GEO.ox) <= GEO.W - 12 && px(r.y1, x, GEO.oy) <= GEO.H - 12;
}

// Cek penempatan satu ubin terhadap ubin lain. reason: overlap | mismatch | nocontact | bounds
export function checkPlacement(t, others, x) {
  if (!inBounds(t, x)) return { ok: false, reason: 'bounds' };
  const r = rectOf(t);
  let touched = false, bad = false;
  for (const o of others) {
    const ro = rectOf(o);
    if (overlaps(r, ro)) return { ok: false, reason: 'overlap' };
    const c = contact(r, ro);
    if (c) { touched = true; if (!c.ok) bad = true; }
  }
  if (bad) return { ok: false, reason: 'mismatch' };
  if (others.length && !touched) return { ok: false, reason: 'nocontact' };
  return { ok: true };
}

// Cari posisi snap untuk ubin yang dijatuhkan. (dx,dy) = pojok kiri atas ubin dalam piksel kanvas.
export function snap(proto, others, x, dx, dy) {
  const d = dims(proto);
  const wpx = val(d.w, x) * GEO.u, hpx = val(d.h, x) * GEO.u;
  if (!others.length) {
    const kx = Math.min(8, Math.max(1, Math.round((dx - GEO.ox) / GEO.u)));
    const ky = Math.min(6, Math.max(1, Math.round((dy - GEO.oy) / GEO.u)));
    const t = { ...proto, X: [0, kx], Y: [0, ky] };
    const c = checkPlacement(t, others, x);
    return c.ok ? { ok: true, X: t.X, Y: t.Y } : { ok: false, reason: c.reason, X: t.X, Y: t.Y };
  }
  const R = 40 + 0.6 * Math.max(wpx, hpx);
  const xs = new Map(), ys = new Map();
  for (const o of others) {
    const r = rectOf(o);
    for (const p of [r.x1, sub(r.x0, d.w), r.x0, sub(r.x1, d.w)]) xs.set(pkey(p), p);
    for (const p of [r.y1, sub(r.y0, d.h), r.y0, sub(r.y1, d.h)]) ys.set(pkey(p), p);
  }
  let best = null;
  for (const X0 of xs.values()) {
    for (const Y0 of ys.values()) {
      const t = { ...proto, X: X0, Y: Y0 };
      const c = checkPlacement(t, others, x);
      if (c.reason === 'overlap' || c.reason === 'bounds' || c.reason === 'nocontact') continue;
      const dist = Math.hypot(px(X0, x, GEO.ox) - dx, px(Y0, x, GEO.oy) - dy);
      if (dist <= R && (!best || dist < best.dist)) best = { dist, X: X0, Y: Y0, ok: c.ok, reason: c.reason };
    }
  }
  if (!best) return { ok: false, reason: 'far' };
  return best.ok ? { ok: true, X: best.X, Y: best.Y } : { ok: false, reason: 'mismatch', X: best.X, Y: best.Y };
}

export const fits = (tiles, x) => tiles.every((t) => inBounds(t, x));

// ---------- Evaluasi susunan ----------
export function polyStr(p, m) {
  // faktor px + m sebagai teks
  const lead = (p === 1 ? '' : p) + 'x';
  if (m === 0) return lead;
  return lead + (m > 0 ? ' + ' : ' − ') + Math.abs(m);
}

export function evaluate(tiles) {
  if (!tiles.length) return { status: 'empty' };
  const rs = tiles.map(rectOf);
  const uniq = (arr) => {
    const m = new Map();
    arr.forEach((p) => m.set(pkey(p), p));
    return [...m.values()].sort(cmp);
  };
  const xs = uniq(rs.flatMap((r) => [r.x0, r.x1]));
  const ys = uniq(rs.flatMap((r) => [r.y0, r.y1]));
  const kind = (a, b) => {
    const l = sub(b, a);
    return eq(l, X) ? 'x' : eq(l, ONE) ? 'u' : null;
  };
  const colK = [], rowK = [];
  for (let i = 0; i + 1 < xs.length; i++) colK.push(kind(xs[i], xs[i + 1]));
  for (let i = 0; i + 1 < ys.length; i++) rowK.push(kind(ys[i], ys[i + 1]));
  const base = { xs, ys, colK, rowK };
  if (colK.includes(null) || rowK.includes(null)) return { status: 'gap', ...base, gaps: [] };
  const grid = rowK.map(() => colK.map(() => null));
  for (let k = 0; k < tiles.length; k++) {
    const r = rs[k];
    const c0 = xs.findIndex((p) => eq(p, r.x0)), c1 = xs.findIndex((p) => eq(p, r.x1));
    const r0 = ys.findIndex((p) => eq(p, r.y0)), r1 = ys.findIndex((p) => eq(p, r.y1));
    if (c1 !== c0 + 1 || r1 !== r0 + 1 || grid[r0][c0]) return { status: 'gap', ...base, gaps: [] };
    grid[r0][c0] = tiles[k];
  }
  const gaps = [];
  grid.forEach((row, j) => row.forEach((c, i) => { if (!c) gaps.push({ i, j }); }));
  if (gaps.length) return { status: 'gap', ...base, gaps };
  const sg = (t) => (isNeg(t.key) ? -1 : 1);
  let r0 = -1, c0 = -1;
  grid.forEach((row, j) => row.forEach((t, i) => { if (r0 < 0 && t.key === 'x2') { r0 = j; c0 = i; } }));
  if (r0 < 0) return { status: 'sign', ...base, gaps };
  const colS = colK.map((_, i) => sg(grid[r0][i]));
  const rowS = rowK.map((_, j) => sg(grid[j][c0]));
  for (let j = 0; j < rowK.length; j++)
    for (let i = 0; i < colK.length; i++) if (sg(grid[j][i]) !== rowS[j] * colS[i]) return { status: 'sign', ...base, gaps };
  let p = 0, m = 0, q = 0, n = 0;
  colK.forEach((k, i) => { if (k === 'x') p += colS[i]; else m += colS[i]; });
  rowK.forEach((k, j) => { if (k === 'x') q += rowS[j]; else n += rowS[j]; });
  return {
    status: 'rect', ...base, gaps, grid,
    W: { p, m }, H: { q, n },
    square: p === q && m === n,
    box: { x0: xs[0], y0: ys[0], x1: xs[xs.length - 1], y1: ys[ys.length - 1] },
  };
}

// ---------- Hitung ubin ----------
export const KEYS = ['x2', 'x', 'u', 'nx', 'nu'];
export function countsOf(tiles) {
  const c = { x2: 0, x: 0, u: 0, nx: 0, nu: 0 };
  tiles.forEach((t) => c[t.key]++);
  return c;
}
export function baseTotals(m, lengkapi) {
  const t = { x2: m.a, x: Math.max(m.b, 0), nx: Math.max(-m.b, 0), u: Math.max(m.c, 0), nu: Math.max(-m.c, 0) };
  if (lengkapi) { t.u = Infinity; t.nu = 0; }
  return t;
}
export function remaining(totals, tiles) {
  const c = countsOf(tiles), r = {};
  KEYS.forEach((k) => (r[k] = totals[k] - c[k]));
  return r;
}

// Bersihkan zona: hapus pasangan +x/−x atau 1/−1 yang bersentuhan.
export function clearZone(tiles) {
  const used = new Set();
  const rs = tiles.map(rectOf);
  for (let i = 0; i < tiles.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < tiles.length; j++) {
      if (used.has(j)) continue;
      const a = tiles[i], b = tiles[j];
      const pair = (a.key === 'x' && b.key === 'nx') || (a.key === 'nx' && b.key === 'x') ||
        (a.key === 'u' && b.key === 'nu') || (a.key === 'nu' && b.key === 'u');
      if (!pair || (baseOf(a.key) === 'x' && !!a.rot !== !!b.rot)) continue;
      if (contact(rs[i], rs[j])) { used.add(i); used.add(j); break; }
    }
  }
  return used;
}

// ---------- Bank misi ----------
function factorize(a, b, c) {
  for (let p = 1; p <= a; p++) {
    if (a % p) continue;
    const q = a / p;
    if (p < q) continue;
    for (let m = -60; m <= 60; m++)
      for (let n = -60; n <= 60; n++)
        if (m * n === c && p * n + q * m === b && (p > q || m >= n)) return { p, q, m, n };
  }
  return null;
}
const mk = (arr, sector) => arr.map(([a, b, c], i) => ({ sector, no: i + 1, a, b, c, f: factorize(a, b, c) }));
const S1 = [[1,3,2],[1,4,3],[1,5,6],[1,6,5],[1,6,8],[1,7,12],[1,7,10],[1,9,8],[1,8,15],[1,9,20],[1,8,12],[1,9,18],[1,10,24],[1,11,30],[1,10,21]];
const S2 = [[1,1,-6],[1,-2,-3],[1,3,-10],[1,-5,4],[1,-5,6],[1,5,-6],[1,-3,-10],[1,1,-12],[1,-8,12],[1,-5,-14],[1,5,-24],[1,-9,20],[1,3,-28],[1,-5,-24],[1,-10,21]];
const S3 = [1,2,3,4,5,6,7,8,9,-1,-2,-3,-4,-5,-6].map((s) => [1, 2 * s, s * s]);
const S4 = [[2,7,3],[2,5,2],[3,10,3],[2,-5,3],[3,7,2],[2,1,-6],[3,-8,4],[2,-7,6],[4,8,3],[3,1,-2],[5,11,2],[4,-9,2],[6,5,-6],[4,-4,-3],[6,-7,2]];
export const MISSIONS = { 1: mk(S1, 1), 2: mk(S2, 2), 3: mk(S3, 3), 4: mk(S4, 4) };

export const SECTORS = {
  1: { name: 'Pemukiman Asri', zone: 'Pemukiman', materi: 'x² + bx + c, semua suku positif', unlockPts: 1050 },
  2: { name: 'Area Komersial', zone: 'Komersial', materi: 'x² + bx + c, ada suku negatif (pasangan nol)' },
  3: { name: 'Alun-Alun Kota', zone: 'Alun-alun', materi: 'Kuadrat sempurna (x + a)²' },
  4: { name: 'Kawasan Industri', zone: 'Industri', materi: 'ax² + bx + c = 0 dengan a > 1' },
};

// Susunan jawaban lengkap (dipakai untuk uji dan petunjuk).
export function solutionTiles(f) {
  const { p, q, m, n } = f;
  const cols = [], rows = [];
  for (let i = 0; i < p; i++) cols.push({ k: 'x', s: 1, X: [i, 1] });
  for (let i = 0; i < Math.abs(m); i++) cols.push({ k: 'u', s: Math.sign(m), X: [p, 1 + i] });
  for (let i = 0; i < q; i++) rows.push({ k: 'x', s: 1, Y: [i, 1] });
  for (let i = 0; i < Math.abs(n); i++) rows.push({ k: 'u', s: Math.sign(n), Y: [q, 1 + i] });
  const out = [];
  rows.forEach((r) => cols.forEach((c) => {
    const s = r.s * c.s;
    let key, rot = false;
    if (c.k === 'x' && r.k === 'x') key = 'x2';
    else if (c.k === 'u' && r.k === 'u') key = s > 0 ? 'u' : 'nu';
    else { key = s > 0 ? 'x' : 'nx'; rot = c.k === 'u'; }
    out.push({ key, rot, X: c.X, Y: r.Y });
  }));
  return out;
}

// ---------- Akar & pecahan ----------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export function rootOf(p, m) {
  // p·x + m = 0 -> x = -m/p
  let num = -m, den = p;
  const g = gcd(num, den) || 1;
  num /= g; den /= g;
  return { num, den };
}

// ---------- Petunjuk ----------
export function hintText(mission, level) {
  const f = mission.f;
  const kind = mission.sector;
  if (level === 1) {
    if (kind === 1) return 'Letakkan bangunan di pojok. Perhatikan jumlah jalan setapak di sisi kanan dan sisi bawah. Jumlahnya harus sama dengan banyak jalan di tray.';
    if (kind === 2) return mission.c < 0
      ? 'Petak negatif di sudut belum punya tempat yang pas. Coba tambahkan pasangan nol dari jalan setapak, lalu susun jalan dan parit di sisi bangunan.'
      : 'Semua suku sudah tersedia. Susun parit di sisi kanan dan bawah bangunan, lalu isi sudutnya.';
    if (kind === 3) return 'Alun-alun berbentuk persegi. Bagi jalan setapak sama banyak ke sisi kanan dan sisi bawah, lalu isi sudutnya.';
    return 'Susun bangunan menjadi beberapa kolom dan baris. Jalan di sisi kanan dan bawah harus sama tinggi dan lebar dengan bangunan.';
  }
  if (level === 2) {
    const R = Math.abs(f.m), B = Math.abs(f.n);
    if (kind === 4) return `Susun ${f.p} bangunan ke samping dan ${f.q} ke bawah. Sisi kanan: ${Math.abs(f.m)} lajur. Sisi bawah: ${Math.abs(f.n)} lajur. Sudut kanan bawah berisi ${Math.abs(f.m * f.n)} petak.`;
    return `Coba ${R} ruas jalan di sisi kanan dan ${B} ruas di sisi bawah. Sudut kanan bawah berisi ${Math.abs(f.m * f.n)} petak.`;
  }
  return 'Bangunan utama sudah ditempatkan otomatis di pojok kiri atas. Lanjutkan dengan jalan setapak dan petak di sekelilingnya.';
}
