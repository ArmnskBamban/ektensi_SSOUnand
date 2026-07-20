# Batasan yang Diketahui

## Portal Akademik lama

Route dan DOM untuk jadwal, KRS, KHS, transkrip, materi, serta pengumuman pada `portal.unand.ac.id` belum dipetakan secara aman. Karena itu versi 0.2.0 tidak mengarang parser atau selector untuk portal tersebut.

## Laporan kehadiran

Parser dibuat berbasis header umum yang sudah diuji dengan fixture sanitasi. Jika tabel resmi menggunakan nama kolom berbeda, SIAKAD-X menampilkan state kosong/parsial dan portal asli tetap tersedia. Struktur live setelah setiap kombinasi filter masih perlu diverifikasi pengguna.

## Bimbingan TA

Akun yang dipetakan sebelumnya tidak memiliki tabel/form Bimbingan TA. Versi ini menyediakan app shell dan state yang jujur, bukan data dummy.

## Perhitungan dan simulasi

- Metrik resmi yang tersedia di tabel portal diprioritaskan.
- Perhitungan turunan dari riwayat mata kuliah dapat berbeda apabila aturan pengulangan mata kuliah atau skala nilai resmi memiliki ketentuan khusus.
- Simulasi nilai selalu diberi label **estimasi lokal** dan tidak mengubah data kampus.

## Perubahan portal

Ekstensi bergantung pada DOM portal yang dapat berubah tanpa pemberitahuan. Parser memakai header, fallback selector, observer, dan error state untuk mengurangi kerusakan, tetapi pembaruan adapter mungkin tetap diperlukan.
