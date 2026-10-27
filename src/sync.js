// Kirim progres siswa ke Google Sheets lewat Google Apps Script (lihat folder apps-script/).
// Alamat diisi di file .env (VITE_SHEET_URL). Bila kosong, progres hanya tersimpan di browser siswa.
const URL_SHEET = (import.meta.env.VITE_SHEET_URL || '').trim();
export const syncEnabled = URL_SHEET !== '';

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
export const profileKey = (p) => slug([p.name, p.klass, p.school].join('|').toLowerCase());

export function summarize(save) {
  const n = [1, 2, 3, 4].map((s) => { let c = 0; for (let i = 1; i <= 15; i++) if (save.done[`${s}-${i}`]) c++; return c; });
  const points = Object.values(save.done).reduce((a, b) => a + b, 0);
  return { key: profileKey(save.profile), name: save.profile.name, klass: save.profile.klass || '', school: save.profile.school || '', done: save.done, n, points, updatedAt: new Date().toISOString() };
}

let chain = Promise.resolve();
export function pushProgress(save, onStatus) {
  if (!syncEnabled) { onStatus('local'); return chain; }
  chain = chain.then(() =>
    fetch(URL_SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(summarize(save)) })
      .then(() => onStatus('synced'))
      .catch(() => onStatus('local')));
  return chain;
}

export async function fetchRows(token) {
  const r = await fetch(URL_SHEET + '?token=' + encodeURIComponent(token));
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.rows;
}
