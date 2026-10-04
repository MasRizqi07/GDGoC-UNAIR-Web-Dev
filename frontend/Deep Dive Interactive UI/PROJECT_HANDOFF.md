# Project Handoff — Deep Dive JavaScript & DOM Playground

**Tanggal laporan:** 4 Oktober 2026  
**Status pekerjaan:** Implementasi refresh UI selesai; bukti verifikasi awal tersedia  
**Audiens:** QA Engineer, DevOps Engineer, Project Manager, dan engineer penerus  
**Cakupan:** `frontend/Deep Dive Interactive UI` saja

> **Ringkasan kesiapan:** Perubahan UI dan interaksi telah selesai serta melewati pemeriksaan sintaks, smoke test browser, pemeriksaan responsive, dan audit Lighthouse. Dokumen ini bukan deklarasi bahwa website telah dirilis atau disetujui untuk produksi. Pengujian lintas-browser/manual, triase temuan dependensi, dan keputusan hosting masih perlu ditangani sebelum rilis publik.

## 1. Ringkasan eksekutif

Deep Dive adalah website edukasi interaktif untuk mempelajari JavaScript dan DOM melalui contoh yang dapat dicoba langsung di browser. Implementasi menggunakan HTML, CSS, JavaScript native, Custom Elements, Shadow DOM, dan browser API—tanpa framework aplikasi atau backend.

Pekerjaan terbaru memperbarui presentasi menjadi antarmuka responsif bergaya editorial/teknis, mempertahankan lab yang sudah ada, memperbaiki perilaku keyboard dan fokus, serta memperjelas panduan menjalankan dan memvalidasi proyek. Data tema dan todo tetap lokal pada browser. Tidak ada akun, layanan API, atau penyimpanan server yang ditambahkan.

Hasil yang telah diverifikasi:

- `npm test` berhasil, tetapi hanya menjalankan `node --check script.js`; ini **bukan** unit test.
- `git diff --check` tidak menemukan whitespace error.
- Smoke test browser mencakup alur utama tab, tema, modal, todo, drag-and-drop, inspector, dan shortcut.
- Tidak ditemukan error console pada pemeriksaan halaman utama.
- Tidak ada horizontal overflow pada viewport 320 px maupun desktop yang diuji.
- Audit Lighthouse desktop dan mobile memperoleh skor 100 pada Accessibility, Best Practices, SEO, dan Agentic Browsing setelah temuan kontras/nama aksesibel awal diperbaiki.
- Pemulihan dependency development melaporkan 10 temuan audit npm (6 moderate, 4 high). Temuan belum ditriase satu per satu dan tidak ada auto-fix yang dijalankan.

## 2. Konsep produk dan sasaran pengguna

### Tujuan

Memberi pengguna cara praktis untuk memahami hubungan antara event, elemen DOM, state, komponen browser-native, dan aksesibilitas. Setiap lab menunjukkan perubahan yang dapat diamati, bukan hanya uraian konsep.

### Pengguna yang dituju

- Pemula JavaScript yang sedang belajar DOM dan event.
- Peserta workshop/pembelajaran mandiri yang membutuhkan demo browser kecil.
- Pengajar atau mentor yang ingin menunjukkan konsep tabs, drag-and-drop, penyimpanan lokal, atau capture phase.

### Pengalaman utama

1. Pengguna membuka halaman pengantar dan memilih salah satu workbench.
2. Pengguna mencoba kontrol pada lab dan melihat perubahan state/DOM secara langsung.
3. Pengguna membuka tutorial terkait untuk membaca penjelasan implementasi.
4. Pengguna dapat mengganti tema dan, pada lab todo, menyimpan daftar tugas lokal.

## 3. Ruang lingkup dan batas proyek

### Termasuk dalam pekerjaan ini

- Refresh struktur halaman, hierarki visual, responsivitas, fokus, serta gerakan/reduced motion.
- Penguatan state tab utama dan nested tabs.
- Perbaikan fokus, Escape, backdrop, dan tombol penutup modal.
- Penguatan penyimpanan todo dan penanganan error storage.
- Penanganan drag-and-drop terhadap target turunan elemen daftar.
- Lifecycle dan pencegahan klik aktif pada mode DOM inspector.
- Perlindungan shortcut `G` agar tidak mengganggu input, termasuk input di Shadow DOM.
- Koreksi skrip `npm start` dan penggantian placeholder `npm test` menjadi pemeriksaan sintaks.
- Lockfile untuk dependency development yang sudah dideklarasikan serta pengecualian `node_modules` lokal.
- Dokumentasi pelaksanaan dan handoff.

### Tidak termasuk / belum disepakati

- Refactor backend atau frontend lain di repository.
- Migrasi framework, bundler, TypeScript, atau framework UI.
- API, autentikasi, analytics, database/server-side persistence.
- Penentuan hosting, domain, pipeline CI/CD, environment production, atau kebijakan cache.
- Triase dan pembaruan dependency atas temuan audit npm.
- Sertifikasi WCAG, pengujian screen reader formal, atau jaminan dukungan browser tertentu.

## 4. Fitur dan peta website

| Bagian | Fungsi | Implementasi |
|---|---|---|
| Pengantar / hero | Memperkenalkan lab dan tujuan belajar | `index.html`, `styles.css` |
| Widgets | Contoh nested tabs, reorder daftar, dan shortcut `G` | `demo-tabs`, `drag-list`, handler halaman |
| Todo & state | Tambah/hapus tugas dan simpan di browser | `todo-app`, `localStorage` |
| DOM inspector | Pilih elemen untuk melihat tag, class, dan teks tanpa mengaktifkan kliknya | `dom-inspector`, click capture |
| Quick note | Modal dengan close button, backdrop, Escape, focus trap/return | Elemen dialog dan handler halaman |
| Tutorial | Penjelasan lanjutan untuk widgets, todo, dan inspector | `tutorials/widgets.html`, `tutorials/todo.html`, `tutorials/inspector.html` |

Komponen custom yang didaftarkan pada halaman:

- `<demo-tabs>`
- `<drag-list>`
- `<todo-app>`
- `<dom-inspector>`

## 5. Arsitektur dan keputusan teknis

### Arsitektur ringkas

```text
index.html
├── styles.css                  Global layout, tema, responsive, motion
├── script.js                   Custom Elements dan interaksi halaman
│   ├── demo-tabs               Tab contoh dalam Shadow DOM
│   ├── drag-list               Reorder dengan HTML Drag and Drop API
│   ├── todo-app                State lokal dan render daftar
│   └── dom-inspector           Event capture dan inspeksi elemen
└── tutorials/                  Panduan konsep dan contoh tiap lab
```

### Runtime dan penyimpanan

- Website utama adalah static client-side page; tidak ada runtime backend.
- Custom Elements mengisolasi markup dan sebagian style melalui Shadow DOM.
- Tema menggunakan key `ui-dark` dengan nilai string `"1"` atau `"0"`.
- Todo menggunakan key `demo-todos-v1` yang berisi JSON array string, misalnya `["Baca DOM events"]`.
- Data tema/todo disimpan pada origin browser pengguna. Aplikasi utama tidak mengirim data tersebut ke server.
- Input todo ditampilkan sebagai teks, bukan disisipkan sebagai markup.
- Motion dikurangi saat `prefers-reduced-motion: reduce` aktif.
- Kode JavaScript dimuat sebagai deferred classic script. Halaman utama tidak memerlukan langkah build.

### Keputusan dan trade-off

- **Vanilla JavaScript dipertahankan:** sesuai tujuan belajar browser API dan menghindari kompleksitas toolchain.
- **`npm test` menjadi syntax check:** memberi perintah validasi yang dapat diulang tanpa menambahkan test framework. Konsekuensinya, perilaku tetap memerlukan automated/browser tests terpisah.
- **`live-server` tetap dependency development:** dipakai untuk preview lokal, bukan server yang ditetapkan untuk deployment production.
- **Tidak menjalankan `npm audit fix`:** menjaga perubahan versi dependency di luar scope tetap dihindari; security findings perlu ditriase dengan owner dan rencana yang eksplisit.

## 6. File dan artefak yang relevan

| Path | Peran |
|---|---|
| `index.html` | Struktur halaman, workbench, dialog, navigasi/tutorial, metadata |
| `styles.css` | Token visual, tema light/dark, layout responsive, focus, motion |
| `script.js` | Custom Elements, tab utama, tema, modal, dan shortcut |
| `tutorials/` | Tiga halaman walkthrough yang ditautkan oleh lab |
| `package.json` | Skrip development dan validasi |
| `package-lock.json` | Dependency lockfile untuk instalasi reproducible |
| `.gitignore` | Mengecualikan `node_modules/` dan `npm-debug.log*` pada proyek |
| `README.md` | Petunjuk penggunaan dan batas validasi singkat |
| `task.md` | Batas scope, acceptance criteria, dan bukti penyelesaian |
| `__tests__/placeholder.test.js` | Placeholder test lama; tidak dijalankan oleh `npm test` saat ini |

## 7. Handoff QA

### Bukti yang sudah tersedia

| Area | Pemeriksaan | Hasil |
|---|---|---|
| Syntax | `npm test` → `node --check script.js` | Lulus |
| Patch hygiene | `git diff --check` | Lulus |
| Main tabs | Klik, selected/hidden/ARIA sync, arrow navigation | Smoke test lulus |
| Nested tabs | Konten berganti tanpa menyembunyikan kontrol tab | Smoke test lulus |
| Tema | Toggle dan persistensi `ui-dark` lintas reload | Smoke test lulus |
| Modal | Close button, “Back to the lab”, backdrop, Escape, focus trap, return focus | Smoke test lulus |
| Todo | Tambah/hapus, persistensi, dan render state kosong | Smoke test lulus |
| Drag-and-drop | Reorder Item 1/2 tanpa duplikasi atau kehilangan item | Smoke test lulus |
| Inspector | Start/stop, inspeksi klik tanpa menjalankan aksi target, cleanup | Smoke test lulus |
| Shortcut | `G` bekerja di luar input; tidak mengambil alih input todo di Shadow DOM | Smoke test lulus |
| Responsive | Viewport 320 px dan desktop 1440 px | Tidak ada horizontal overflow |
| Reduced motion | Pemeriksaan computed animation/transition saat preferensi reduce | Durasi tereduksi menjadi `0.00001s` |
| Console | Halaman utama setelah interaksi | Tidak ada error console |
| Lighthouse | Desktop (light/dark) dan mobile | Empat kategori yang diaudit masing-masing 100 |
| Tutorial links | Ketiga URL tutorial | HTTP 200 pada preview |

### Pekerjaan QA yang disarankan berikutnya

1. Tambahkan automated functional/E2E suite; `__tests__/placeholder.test.js` masih placeholder dan `npm test` tidak mengeksekusinya.
2. Ulangi skenario utama di browser yang menjadi target tim (misalnya Chrome, Firefox, Safari/Edge sesuai dukungan yang disepakati).
3. Lakukan pemeriksaan keyboard dan screen reader manual pada tabs, modal, form todo, drag-and-drop, dan inspector.
4. Uji storage yang dinonaktifkan/penuh, data todo rusak, halaman dibuka melalui origin baru, serta perilaku lintas tab.
5. Verifikasi tutorial live-edit secara terpisah; halaman tersebut menggunakan `innerHTML` untuk memasang markup yang diketik ke preview.
6. Simpan hasil regression run dengan versi browser, OS, viewport, dan tanggal agar dapat direproduksi.

### Batas interpretasi hasil

- Lighthouse adalah pemeriksaan otomatis berbasis browser; skor 100 bukan sertifikasi aksesibilitas dan tidak menggantikan pengujian assistive technology/manual.
- Browser smoke test sebelumnya dijalankan manual/terarah di browser terintegrasi, bukan sebagai test suite yang dapat dijalankan ulang otomatis dari repository.
- `node --check` membuktikan sintaks `script.js` valid, bukan kebenaran semua alur runtime.

## 8. Handoff DevOps dan deployment

### Menjalankan secara lokal

Dari folder `frontend/Deep Dive Interactive UI`:

```sh
npm ci
npm start
npm test
```

`npm start` menjalankan `live-server` pada `http://127.0.0.1:5500/`. Alternatifnya, buka `index.html` langsung di browser; beberapa fitur storage mungkin bergantung pada perilaku browser terhadap origin/file URL.

### Status operasional saat handoff

- Tidak ada pipeline CI/CD atau konfigurasi hosting yang ditetapkan dalam scope pekerjaan ini.
- Tidak ada step build frontend.
- Versi minimum Node.js belum ditentukan melalui `engines` pada `package.json`; tim sebaiknya menyepakati dan mendokumentasikan versi Node/npm yang digunakan runner sebelum membuat pipeline.
- `live-server` adalah server development. Pilih static hosting yang sesuai standar organisasi untuk deployment; jangan menjadikan perintah preview ini sebagai deployment production tanpa tinjauan.
- Deployment static perlu menyertakan `index.html`, `styles.css`, `script.js`, dan direktori `tutorials/`. `node_modules/` tidak perlu dipublikasikan.
- Pastikan relative paths dan URL tutorial tetap berfungsi bila website dipasang pada subpath, bukan root domain.

### Checklist sebelum deployment

- [ ] Pilih target hosting, domain/base path, owner layanan, dan environment.
- [ ] Tentukan/pin versi Node/npm untuk CI; `npm ci` harus berjalan menggunakan lockfile yang ditinjau.
- [ ] Tentukan kebijakan cache untuk HTML versus asset dan konfirmasi HTTPS.
- [ ] Tinjau security headers/CSP bersama pemilik hosting. Tutorial live-edit menggunakan markup preview dinamis; kebijakan yang membatasi inline style/script atau markup perlu diuji terhadap implementasi sebenarnya.
- [ ] Jalankan test otomatis dan audit dependency setelah triase/approval.
- [ ] Verifikasi semua tutorial, direct navigation, console, keyboard, dan tampilan pada URL hosting final.
- [ ] Sepakati rollback/versi rilis dan pemilik monitoring untuk static hosting.

### Catatan dependency dan keamanan

Pada saat dependency development dipulihkan, npm melaporkan **10 temuan audit: 6 moderate dan 4 high**. Rincian paket/advisory dan kelayakan upgrade belum menjadi hasil pekerjaan ini. DevOps/owner dependency perlu menjalankan audit terbaru, memeriksa advisory serta jalur dependency, menguji perbaikan, lalu meninjau perubahan lockfile sebelum publikasi. Jangan menganggap jumlah tersebut sebagai temuan yang sudah diselesaikan atau sebagai runtime exposure yang sudah diklasifikasikan.

Tutorial live-edit sengaja mengubah teks editor menjadi preview markup melalui `innerHTML`. Ini adalah bagian dari demo authoring lokal, tetapi harus dianggap sebagai batas kepercayaan: jangan mengalirkan konten tak tepercaya/remote ke editor atau preview. Sebelum membuka editor tersebut bagi input publik, desain ulang dengan sanitasi dan/atau sandbox terisolasi (contohnya iframe sandbox) serta review keamanan.

## 9. Handoff Project Manager

### Status deliverable

| Workstream | Status | Keterangan |
|---|---|---|
| Baseline dan batas scope | Selesai | Scope terbatas pada playground ini |
| Refresh UI/responsif | Selesai | Tema, layout, hierarki visual, reduced motion |
| Interaksi dan aksesibilitas awal | Selesai | Tab, modal, todo, drag list, inspector, shortcut |
| Validasi dan dokumentasi handoff | Selesai | Smoke test dan hasil Lighthouse dicatat |
| Automated browser/unit test suite | Belum selesai | Rekomendasi fase engineering lanjutan |
| Dependency audit remediation | Belum selesai | Butuh triase dan keputusan pemilik dependency |
| Hosting dan pipeline release | Belum ditetapkan | Tidak termasuk deliverable saat ini |

### Urutan kerja lanjutan yang direkomendasikan

1. **QA:** tetapkan browser/platform target dan buat automated regression tests untuk acceptance criteria pada `task.md`.
2. **DevOps/security owner:** triase temuan npm audit, tentukan versi runtime/tooling, dan sepakati hosting serta security headers.
3. **Product/project manager:** putuskan apakah tutorial live-edit tetap hanya demo lokal atau akan tersedia untuk input publik; setujui kriteria rilis dan prioritas aksesibilitas.
4. **Engineering:** selesaikan temuan yang disetujui, jalankan test pada URL preview/staging, dan minta QA sign-off.
5. **Release owner:** dokumentasikan keputusan deploy, rollback, dan smoke test pascadeploy sebelum mengumumkan rilis.

### Kriteria rekomendasi untuk release sign-off

- Functional regression automation tersedia dan lulus pada browser target.
- Temuan dependency mendapat keputusan tertulis (diperbaiki, dimitigasi, atau diterima dengan owner/tanggal review).
- Aksesibilitas keyboard dan assistive technology telah diperiksa manual sesuai standar tim.
- Hosting/security headers tidak mematahkan halaman atau tutorial live-edit.
- Semua asset dan tutorial bekerja dari URL produksi final, termasuk bila berada di subpath.
- Product/QA/DevOps owners menyetujui checklist, batas yang masih diterima, dan rencana rollback.

## 10. Referensi kerja

- [README.md](./README.md) — setup dan ringkasan fitur untuk developer.
- [task.md](./task.md) — acceptance criteria dan evidence implementasi.
- [index.html](./index.html), [styles.css](./styles.css), [script.js](./script.js) — sumber implementasi.
- [package.json](./package.json) dan [package-lock.json](./package-lock.json) — skrip serta dependency development.
- [tutorials/](./tutorials/) — walkthrough pengguna.

