# Instalasi SIAKAD-X

## Menggunakan build siap pakai

1. Ekstrak arsip SIAKAD-X.
2. Buka `chrome://extensions`.
3. Aktifkan **Developer mode** di kanan atas.
4. Klik **Load unpacked**.
5. Pilih folder `dist`.
6. Pastikan kartu ekstensi menampilkan versi `0.2.0` tanpa error.
7. Login ke SSO Unand dan buka Attendance Unand.

## Setelah memperbarui source

```bash
npm ci
npm run lint
npm run type-check
npm test -- --run
npm run build
```

Setelah build selesai:

1. Buka `chrome://extensions`.
2. Klik **Reload** pada SIAKAD-X.
3. Muat ulang tab Attendance Unand.

## Memeriksa error

- Buka `chrome://extensions` lalu periksa tombol **Errors** pada kartu ekstensi.
- Untuk content script, buka DevTools pada halaman Attendance Unand dan lihat Console.
- Aktifkan **Mode debug** hanya saat diperlukan melalui halaman Pengaturan.
- Jangan membagikan log yang mengandung data akun atau screenshot akademik tanpa disanitasi.

## Mengembalikan portal asli

- Klik **Tampilan asli** pada topbar SIAKAD-X; atau
- nonaktifkan SIAKAD-X melalui popup.

DOM portal tidak dihapus sehingga fungsi resmi tetap dapat digunakan.
