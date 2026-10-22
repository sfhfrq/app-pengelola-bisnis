-- =========================================================
-- Seed data DEMO — App Pengelola Bisnis
-- Hanya menyentuh id 900-999 dan kode berawalan 'DEMO-'.
-- Jalankan 'node seedDemo.js --hapus' untuk membersihkan.
-- =========================================================
USE `pengelola_bisnis`;

-- Hapus demo lama (detail ikut terhapus lewat ON DELETE CASCADE)
DELETE FROM `transaksi` WHERE `kode_transaksi` LIKE 'DEMO-%';
DELETE FROM `produk` WHERE `id` BETWEEN 900 AND 999;

-- Produk demo
INSERT INTO `produk` (`id`, `nama_produk`, `harga`, `stok`, `is_active`) VALUES
  (901, 'Kopi Kapal Api Sachet', 2000.00, 48, 1),
  (902, 'Teh Kotak 200ml', 4500.00, 8, 1),
  (903, 'Minyak Goreng 1L', 17000.00, 0, 1),
  (904, 'Beras Premium 5kg', 68000.00, 12, 1),
  (905, 'Gula Pasir 1kg', 15000.00, 30, 1);

-- Transaksi demo + rincian item
-- DEMO-2026-0001 — Andi Wijaya (PAID, 26000.00)
-- DEMO-2026-0002 — Siti Rahma (PAID, 21000.00)
-- DEMO-2026-0003 — Budi Santoso (PAID, 89000.00)
-- DEMO-2026-0004 — Dewi Lestari (PAID, 20000.00)
-- DEMO-2026-0005 — Budi Santoso (CANCELLED, 4500.00)
-- DEMO-2026-0006 — Rizky Pratama (PAID, 50000.00)
-- DEMO-2026-0007 — Andi Wijaya (PAID, 56500.00)
-- DEMO-2026-0008 — Putri Handayani (PAID, 136000.00)
-- DEMO-2026-0009 — Fajar Nugroho (PAID, 25500.00)
-- DEMO-2026-0010 — Siti Rahma (PAID, 54000.00)
-- DEMO-2026-0011 — Intan Permata (PAID, 42000.00)
-- DEMO-2026-0012 — Bagus Setiawan (PAID, 113000.00)
-- DEMO-2026-0013 — Dewi Lestari (PAID, 51000.00)
-- DEMO-2026-0014 — Putri Handayani (PENDING, 24000.00)
-- DEMO-2026-0015 — Fajar Nugroho (PENDING, 68000.00)
-- DEMO-2026-0016 — Intan Permata (PENDING, 14500.00)
INSERT INTO `transaksi`
  (`id`, `kode_transaksi`, `user_id`, `nama_pembeli`, `total_harga`, `metode_pembayaran`, `status_pembayaran`, `tanggal_transaksi`)
VALUES
  (901, 'DEMO-2026-0001', 1, 'Andi Wijaya', 26000.00, 'CASH', 'PAID', '2026-01-14 09:20:00'),
  (902, 'DEMO-2026-0002', 2, 'Siti Rahma', 21000.00, 'QRIS', 'PAID', '2026-02-08 13:45:00'),
  (903, 'DEMO-2026-0003', 1, 'Budi Santoso', 89000.00, 'TRANSFER', 'PAID', '2026-03-19 10:05:00'),
  (904, 'DEMO-2026-0004', 2, 'Dewi Lestari', 20000.00, 'CASH', 'PAID', '2026-04-02 16:30:00'),
  (905, 'DEMO-2026-0005', 2, 'Budi Santoso', 4500.00, 'QRIS', 'CANCELLED', '2026-04-15 11:15:00'),
  (906, 'DEMO-2026-0006', 1, 'Rizky Pratama', 50000.00, 'QRIS', 'PAID', '2026-05-21 08:15:00'),
  (907, 'DEMO-2026-0007', 2, 'Andi Wijaya', 56500.00, 'CASH', 'PAID', '2026-06-11 14:50:00'),
  (908, 'DEMO-2026-0008', 1, 'Putri Handayani', 136000.00, 'TRANSFER', 'PAID', '2026-07-07 11:10:00'),
  (909, 'DEMO-2026-0009', 2, 'Fajar Nugroho', 25500.00, 'CASH', 'PAID', '2026-08-23 09:40:00'),
  (910, 'DEMO-2026-0010', 1, 'Siti Rahma', 54000.00, 'QRIS', 'PAID', '2026-08-28 15:25:00'),
  (911, 'DEMO-2026-0011', 2, 'Intan Permata', 42000.00, 'CASH', 'PAID', '2026-09-05 10:35:00'),
  (912, 'DEMO-2026-0012', 1, 'Bagus Setiawan', 113000.00, 'TRANSFER', 'PAID', '2026-09-27 13:05:00'),
  (913, 'DEMO-2026-0013', 2, 'Dewi Lestari', 51000.00, 'QRIS', 'PAID', '2026-10-06 09:00:00'),
  (914, 'DEMO-2026-0014', 1, 'Putri Handayani', 24000.00, 'QRIS', 'PENDING', '2026-10-11 15:50:00'),
  (915, 'DEMO-2026-0015', 1, 'Fajar Nugroho', 68000.00, 'QRIS', 'PENDING', '2026-10-12 10:20:00'),
  (916, 'DEMO-2026-0016', 1, 'Intan Permata', 14500.00, 'QRIS', 'PENDING', '2026-10-13 11:40:00');

INSERT INTO `detail_transaksi`
  (`transaksi_id`, `produk_id`, `jumlah`, `harga`, `subtotal`)
VALUES
  (901, 1, 4, 3500.00, 14000.00),
  (901, 901, 6, 2000.00, 12000.00),
  (902, 2, 3, 4000.00, 12000.00),
  (902, 902, 2, 4500.00, 9000.00),
  (903, 1, 6, 3500.00, 21000.00),
  (903, 904, 1, 68000.00, 68000.00),
  (904, 901, 10, 2000.00, 20000.00),
  (905, 902, 1, 4500.00, 4500.00),
  (906, 2, 5, 4000.00, 20000.00),
  (906, 905, 2, 15000.00, 30000.00),
  (907, 1, 8, 3500.00, 28000.00),
  (907, 902, 3, 4500.00, 13500.00),
  (907, 905, 1, 15000.00, 15000.00),
  (908, 904, 2, 68000.00, 136000.00),
  (909, 1, 5, 3500.00, 17500.00),
  (909, 901, 4, 2000.00, 8000.00),
  (910, 2, 6, 4000.00, 24000.00),
  (910, 905, 2, 15000.00, 30000.00),
  (911, 901, 12, 2000.00, 24000.00),
  (911, 902, 4, 4500.00, 18000.00),
  (912, 904, 1, 68000.00, 68000.00),
  (912, 905, 3, 15000.00, 45000.00),
  (913, 1, 10, 3500.00, 35000.00),
  (913, 2, 4, 4000.00, 16000.00),
  (914, 902, 2, 4500.00, 9000.00),
  (914, 905, 1, 15000.00, 15000.00),
  (915, 904, 1, 68000.00, 68000.00),
  (916, 1, 3, 3500.00, 10500.00),
  (916, 901, 2, 2000.00, 4000.00);

