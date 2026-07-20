# Arsitektur SIAKAD-X 0.2.0

## Alur runtime

```text
Attendance Unand live DOM
        ↓
Content script
        ↓
Portal + page detector
        ↓
Cancellation-aware lifecycle
        ↓
Attendance Unand adapter
        ├── reversible app shell
        ├── live-DOM parser/observer
        ├── feature controller
        └── safe storage/messaging
```

## Prinsip adapter

Seluruh detail portal berada di `src/portals/attendance-unand`. Route, selector, parser, observer, UI, dan feature dipisahkan agar perubahan portal tidak menyebar ke fondasi ekstensi.

## Reversible visual takeover

SIAKAD-X tidak mengganti `body.innerHTML` dan tidak menghapus node portal. Class `siakadx-active` mengendalikan takeover visual. Navbar/sidebar/footer asli disembunyikan melalui CSS, sementara form dan data resmi tetap berada di DOM. `cleanupAppShell()` menghapus root, atribut, dan class milik ekstensi.

## Lifecycle

Lifecycle memakai `AbortController`, generation id, dan queue cleanup. Toggle disable atau remount baru langsung membatalkan observer/parser lama sebelum memasang UI berikutnya. Ini mencegah duplicate root dan hasil parser usang.

## Parser

- Parser ringkasan akademik menangani tabel horizontal dan fallback vertikal.
- Parser riwayat mata kuliah dan laporan kehadiran memakai nama header.
- Parser tidak mengandalkan `nth-child` tetap.
- Data dinamis dipantau dari live DOM, bukan hanya respons `fetch()` awal.
- Parse result memiliki state success, partial, empty, loading, dan error.

## Storage

Storage hanya digunakan untuk pengaturan, preferensi filter opsional, dan cache ringkasan non-sensitif. Validator rekursif menolak key terlarang. Background service worker menjadi jalur messaging bagi popup/options dan cache.

## Keamanan presensi

Feature presensi hanya menata workflow dan memeriksa ketersediaan API/permission state. Field rahasia tidak dibaca. Form resmi tidak pernah dikirim oleh ekstensi.
