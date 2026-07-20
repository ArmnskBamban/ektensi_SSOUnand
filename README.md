# SIAKAD-X 0.2.0

SIAKAD-X adalah ekstensi browser Manifest V3 yang mengganti pengalaman visual **Attendance Unand** dengan antarmuka akademik modern, tanpa mengganti backend, autentikasi, atau proses resmi Universitas Andalas.

Versi ini merupakan hasil perbaikan menyeluruh dari source sebelumnya. Redesign tidak lagi berupa panel kecil: navbar, sidebar, tata letak, tabel, form, dashboard, tema, dan tampilan mobile dikendalikan oleh app shell SIAKAD-X yang dapat dikembalikan ke tampilan asli kapan saja.

## Fitur yang tersedia

### Beranda akademik

- Parser tabel IPS, IPK, SKS semester, dan SKS lulus yang mendukung tabel horizontal.
- Ringkasan IP semester, IPK, SKS lulus, dan jumlah mata kuliah.
- Grafik perkembangan IPS/IPK.
- Distribusi nilai.
- Riwayat mata kuliah lengkap dengan pencarian, filter, sorting, dan pagination.
- Simulasi nilai lokal yang diberi label sebagai estimasi dan tidak mengubah data resmi.
- Observer terpisah untuk data portal yang dimuat secara dinamis.

### Ambil absensi

- Tampilan workflow baru dan petunjuk kesiapan kamera/lokasi.
- Form, scanner, dan tombol resmi portal tetap dipakai.
- Tidak membaca atau menyimpan token CSRF, hasil QR, latitude, longitude, cookie, maupun sesi.
- Tidak pernah mengirim absensi otomatis, memalsukan lokasi, atau melakukan replay request.

### Laporan kehadiran

- Form filter resmi tetap digunakan dan tidak dikirim otomatis.
- Filter terakhir dapat diingat secara opsional.
- Parser hasil berbasis nama header, bukan posisi tabel tetap.
- Ringkasan rata-rata kehadiran, mata kuliah di bawah ambang, dan tabel detail.
- Ambang kehadiran dapat diatur pengguna dan selalu ditampilkan sebagai estimasi lokal.

### Bimbingan

- Daftar periode Bimbingan Akademik dengan status, tahun, semester, verifikasi, dan tautan detail yang disanitasi.
- Halaman detail tetap mendapatkan app shell tanpa menyimpan isi percakapan bimbingan.
- Bimbingan TA memiliki state loading, kosong, tersedia, parsial, dan error yang jujur.

### Tampilan dan aksesibilitas

- Full reversible visual takeover terhadap layout AdminLTE lama.
- Tema terang, gelap, atau mengikuti sistem.
- Mode ringkas dan kontras tinggi.
- Navigasi desktop dan mobile.
- Fokus keyboard, caption tabel, `scope="col"`, state loading/empty/error, serta reduced motion.
- Tombol **Tampilan asli** selalu menyediakan jalur kembali dan tidak menghapus DOM portal.
- Enable/disable dan perubahan pengaturan bekerja tanpa harus memuat ulang halaman.

## Portal dan halaman yang didukung

Target produksi saat ini:

```text
https://attendance.unand.ac.id/*
```

Route terverifikasi:

```text
/home
/mahasiswa/absensi/ambilabsensi
/mahasiswa/absensi/report
/mahasiswa/pa/bimbingan-pa-tahun-ajaran-mhs
/mahasiswa/pa/bimbingan-pa-detail-bimbingan-mhs...
/mahasiswa/bimbingan-ta
```

`https://sso.unand.ac.id` hanya diperlakukan sebagai gerbang login. `http://portal.unand.ac.id` belum dimodifikasi karena struktur halaman jadwal/KRS/KHS di portal lama belum dipetakan secara aman.

## Instalasi siap pakai

1. Ekstrak ZIP.
2. Buka `chrome://extensions` pada Chrome/Chromium.
3. Aktifkan **Developer mode**.
4. Pilih **Load unpacked**.
5. Pilih folder `dist` dari proyek ini.
6. Login melalui SSO Unand, lalu buka `https://attendance.unand.ac.id/home`.

Setelah source diubah, jalankan:

```bash
npm ci
npm run build
```

Kemudian klik tombol **Reload** pada kartu ekstensi di `chrome://extensions` dan muat ulang halaman Attendance Unand.

## Pengembangan

Persyaratan:

- Node.js 20 atau lebih baru.
- npm 10 atau lebih baru.
- Chrome/Chromium dengan dukungan Manifest V3.

Perintah utama:

```bash
npm ci
npm run lint
npm run type-check
npm test -- --run
npm run build
```

Semua quality gate di atas harus lulus sebelum folder `dist` digunakan.

## Struktur utama

```text
src/
├── background/                 # service worker dan messaging
├── content/                    # lifecycle, router, dan content entry
├── portals/attendance-unand/   # adapter, parser, feature, selector, app shell
├── shared/                     # storage, logger, result, UI, utilitas
├── popup/                      # popup ekstensi
├── options/                    # pengaturan
└── styles/                     # full redesign Attendance Unand
```

## Prinsip keamanan

SIAKAD-X tidak boleh dan tidak dirancang untuk:

- menyimpan username atau password;
- membaca/menyimpan cookie, access token, refresh token, atau CSRF token;
- membaca/menyimpan QR presensi atau koordinat;
- mengirim form presensi otomatis;
- memalsukan lokasi atau data akademik;
- mengubah nilai di server;
- mengakses data mahasiswa lain.

Seluruh proses visual dan parsing berlangsung di browser pengguna. Portal resmi tetap menjadi sumber data dan pemilik seluruh operasi akademik.

## Status verifikasi

Quality gate source ini:

```text
Build       : lulus
ESLint      : lulus
Type check  : lulus
Unit test   : 13/13 lulus
Prod audit  : 0 vulnerability pada dependency produksi
```

Pengujian otomatis menggunakan fixture HTML yang disanitasi. Karena agent tidak memiliki sesi login pengguna, pengujian manual pada live portal tetap diperlukan setelah pemasangan, terutama ketika struktur HTML resmi berubah.

## Batasan saat ini

Lihat [`KNOWN-LIMITATIONS.md`](./KNOWN-LIMITATIONS.md). Batasan tersebut tidak disembunyikan atau digantikan dengan data buatan.

## Lisensi

MIT. Proyek ini merupakan peningkatan antarmuka independen dan bukan produk resmi Universitas Andalas.
