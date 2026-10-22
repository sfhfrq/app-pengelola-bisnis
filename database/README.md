# Database — App Pengelola Bisnis

## Cara setup dari nol

1. Buka phpMyAdmin → tab **SQL**.
2. Copy-paste isi `schema.sql`, klik **Go**.
3. Copy-paste isi `seed.sql`, klik **Go**.
4. Selesai. Database `pengelola_bisnis` siap dipakai.

## Cara setup lewat migrations (untuk track history)

1. Jalankan `migrations/001_initial_schema.sql` — membuat struktur + data awal.
2. Kalau nanti ada migrasi `002`, `003`, jalankan berurutan.

## Cara rollback

Jalankan `migrations/001_initial_schema_rollback.sql`.
**PERINGATAN**: ini menghapus SEMUA data. Selalu backup dulu.

## Kredensial default

| User  | Password   | Role  |
|-------|------------|-------|
| admin | admin123   | admin |
| budi  | budi123    | kasir |

Ganti password ini di produksi.

## Data demo (opsional)

Supaya dashboard frontend terisi seperti desain referensi:

```bash
cd Backend
node seedDemo.js          # pasang data demo
node seedDemo.js --hapus  # hapus SEMUA data demo
```

Skrip itu menulis `seed_demo.sql` di folder ini, jadi bisa juga dijalankan
manual lewat phpMyAdmin.

Data demo memakai **id 900–999** dan kode transaksi berawalan `DEMO-`. Data asli
(id 1–899) tidak pernah disentuh, baik saat memasang maupun saat menghapus.