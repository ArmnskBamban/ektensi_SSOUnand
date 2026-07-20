# Panduan Pengembangan

## Setup

```bash
npm ci
```

## Quality gate

```bash
npm run lint
npm run type-check
npm test -- --run
npm run build
```

Semua perintah harus lulus. Folder hasil untuk Chrome adalah `dist`.

## Menambah dukungan struktur portal

1. Ambil fixture HTML yang sudah disanitasi.
2. Tambahkan selector bermakna atau deteksi berdasarkan header.
3. Buat parser pure function yang menghasilkan ParseResult.
4. Tambahkan test success, empty, partial, dan perubahan urutan header.
5. Hubungkan parser ke feature live DOM dengan AbortSignal.
6. Pastikan portal asli tetap dapat dipakai ketika parser gagal.

## Aturan keamanan

- Jangan membaca value `_token`, `hasilscan`, `latitude`, atau `longitude`.
- Jangan memakai cookie/token/session di source, fixture, atau log.
- Jangan mengirim form otomatis.
- Jangan menambahkan host permission tanpa kebutuhan yang terverifikasi.
- Jangan cache data profil atau isi percakapan bimbingan.

## Aturan UI

- Root ekstensi wajib memakai `data-siakadx-root`.
- Class CSS wajib memakai prefix `siakadx-` atau variabel `--sx-`.
- Redesign harus reversible melalui lifecycle cleanup.
- Komponen tabel harus memiliki caption dan header scope.
- State loading, empty, partial, dan error harus terlihat jelas.
