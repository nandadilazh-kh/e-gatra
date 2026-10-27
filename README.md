# E-GATRA

Media belajar pemfaktoran persamaan kuadrat dengan ubin aljabar bertema tata kota (React + Vite + Tailwind CSS).

## Menjalankan
```
npm install
npm run dev        # mode pengembangan, buka alamat yang muncul (biasanya http://localhost:5173)
npm run build      # hasil jadi ada di folder dist
npm run preview    # mencoba hasil build
npm run tes        # menguji logika 60 misi
```

## Progres siswa ke guru (opsional)
Salin `.env.example` menjadi `.env`, isi `VITE_SHEET_URL` dengan alamat Web App Google Apps Script
(kode ada di `apps-script/Code.gs`). Langkah lengkap ada di tutorial.

## Isi folder
- `src/logic.js`  aturan ubin, penempatan, validasi, dan bank 60 misi
- `src/art.jsx`   gambar ubin (Mode Kota dan Mode Aljabar)
- `src/screens.jsx` Landing, Peta, Misi, Petunjuk, Profil Pengembang, Buku Proyek, Rekap Guru
- `src/workspace.jsx` Area Kerja dan layar kemenangan
- `src/sync.js`   pengiriman progres ke Google Sheets
- `src/assets/`   logo UNM dan foto pengembang
