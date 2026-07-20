# Privasi dan Keamanan

SIAKAD-X memproses DOM halaman yang sudah dapat dilihat pengguna. Ekstensi tidak mempunyai backend sendiri.

## Data yang dilarang disimpan

- password;
- cookie dan authorization header;
- access token, refresh token, CSRF token;
- NIM, email, atau nama mahasiswa sebagai cache;
- hasil QR presensi;
- latitude dan longitude;
- isi percakapan bimbingan.

Validator storage memeriksa key terlarang secara rekursif. Logger menyamarkan email, ID panjang, JWT, token query, koordinat, dan key sensitif.

## Presensi

SIAKAD-X tidak membaca nilai field `_token`, `hasilscan`, `latitude`, atau `longitude`. Ekstensi tidak memanggil submit, tidak membuat QR, dan tidak memalsukan lokasi. Pengguna tetap menjalankan alur resmi portal.

## Penghapusan data

Halaman Pengaturan menyediakan tombol untuk menghapus cache atau seluruh data lokal SIAKAD-X.
