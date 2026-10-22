-- =========================================================
-- Seed data awal
-- Password di-hash dengan bcrypt cost 10.
-- Ganti password ini di produksi!
-- =========================================================

USE `pengelola_bisnis`;

-- Users: admin (password: admin123), budi (password: budi123)
INSERT INTO `users` (`nama`, `password`, `role`) VALUES
('admin', '$2b$10$yFlwkkYAfcOYRAxt6UQBUOQ.SJfUnGeP56/2V7QVdN4J2heeH2MPi', 'admin'),
('budi',  '$2b$10$Y.GpvRSCncj1bUMLb.hMYeuG8DHsc8d9vLjmR97jmOjVCC2hHgX5e', 'kasir');

-- Produk contoh
INSERT INTO `produk` (`nama_produk`, `harga`, `stok`) VALUES
('Indomie Goreng', 3500.00, 20),
('Aqua 600ml',     4000.00, 15);