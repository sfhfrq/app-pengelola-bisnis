-- =========================================================
-- Rollback migration 001: hapus semua tabel
-- PERINGATAN: menghapus SEMUA data. Backup dulu!
-- =========================================================

-- Urutan drop dibalik dari urutan create — detail dulu (paling banyak FK),
-- lalu transaksi, produk, terakhir users.
DROP TABLE IF EXISTS `detail_transaksi`;
DROP TABLE IF EXISTS `transaksi`;
DROP TABLE IF EXISTS `produk`;
DROP TABLE IF EXISTS `users`;

-- Baris ini opsional: komentari kalau tidak mau hapus database-nya.
-- DROP DATABASE IF EXISTS `pengelola_bisnis`;