# Verifikasi Build 0.2.0

Paket ini dibuat dari instalasi dependency bersih menggunakan `npm ci`.

Hasil quality gate:

```text
npm run build       PASS
npm run lint        PASS
npm run type-check  PASS
npm test -- --run   PASS — 4 files, 13 tests
npm audit --omit=dev PASS — 0 production vulnerabilities
```

Test mencakup:

- route dan portal detection;
- parser IPS/IPK/SKS horizontal;
- parser riwayat mata kuliah dengan urutan header berbeda;
- parser laporan kehadiran dan angka desimal Indonesia;
- sanitasi URL detail bimbingan;
- validasi storage rekursif;
- redaksi log;
- larangan membaca field sensitif atau submit otomatis pada presensi;
- lifecycle cancellation;
- fallback tampilan asli yang reversible.

Pengujian otomatis tidak menggantikan verifikasi manual pada sesi portal nyata karena DOM resmi dapat berubah.
