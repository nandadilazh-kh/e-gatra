// Google Apps Script untuk E-GATRA: menerima progres siswa dan menyajikannya ke guru.
// Pasang di Google Sheets: Ekstensi > Apps Script. Lihat tutorial untuk langkah lengkapnya.

const NAMA_SHEET = 'Progres';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(NAMA_SHEET);
  if (!sh) {
    sh = ss.insertSheet(NAMA_SHEET);
    sh.appendRow(['Kunci', 'Nama', 'Kelas', 'Sekolah', 'Poin', 'Sektor 1', 'Sektor 2', 'Sektor 3', 'Sektor 4', 'Terakhir aktif', 'Detail (JSON)']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Dipanggil aplikasi siswa setiap kali ada misi yang selesai.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const clip = (v, n) => String(v || '').slice(0, n);
    const sh = sheet_();
    const row = [clip(d.key, 150), clip(d.name, 80), clip(d.klass, 40), clip(d.school, 80), Number(d.points) || 0,
      Number(d.n[0]) || 0, Number(d.n[1]) || 0, Number(d.n[2]) || 0, Number(d.n[3]) || 0,
      new Date(d.updatedAt), JSON.stringify(d.done || {}).slice(0, 4000)];
    const last = sh.getLastRow();
    const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().flat() : [];
    const idx = keys.indexOf(row[0]);
    if (idx >= 0) sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.unlock();
  }
}

// Dipanggil layar Rekap Guru. Hanya menjawab bila kode guru benar.
function doGet(e) {
  const token = PropertiesService.getScriptProperties().getProperty('KODE_GURU');
  if (!token || !e.parameter || e.parameter.token !== token) return json_({ error: 'forbidden' });
  const sh = sheet_();
  const last = sh.getLastRow();
  const vals = last > 1 ? sh.getRange(2, 1, last - 1, 11).getValues() : [];
  return json_({
    rows: vals.map((r) => ({ id: r[0], name: r[1], klass: r[2], school: r[3], points: r[4], n: [r[5], r[6], r[7], r[8]], updatedAt: r[9] })),
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
