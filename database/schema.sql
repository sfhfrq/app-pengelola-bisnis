-- =========================================================
-- Schema: pengelola_bisnis
-- Struktur lengkap 4 tabel: users, produk, transaksi, detail_transaksi
-- Engine: InnoDB (wajib untuk transaction + row lock + FK)
-- Charset: utf8mb4 (mendukung emoji & karakter Unicode penuh)
-- =========================================================

CREATE DATABASE IF NOT EXISTS `pengelola_bisnis`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `pengelola_bisnis`;

-- =========================================================
-- Table: users
-- =========================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `nama`       VARCHAR(100) NOT NULL,
  `password`   VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  `role`       ENUM('admin','kasir') NOT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Table: produk
-- =========================================================
CREATE TABLE IF NOT EXISTS `produk` (
  `id`          INT(11)        NOT NULL AUTO_INCREMENT,
  `nama_produk` VARCHAR(100)   NOT NULL,
  `harga`       DECIMAL(12,2)  NOT NULL,
  `stok`        INT(11)        NOT NULL,
  `is_active`   TINYINT(1)     NOT NULL DEFAULT 1 COMMENT 'soft delete',
  `created_at`  TIMESTAMP      NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_produk_nama`   (`nama_produk`),
  KEY `idx_produk_active` (`is_active`),
  CONSTRAINT `chk_produk_harga` CHECK (`harga` >= 0),
  CONSTRAINT `chk_produk_stok`  CHECK (`stok`  >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Table: transaksi
-- =========================================================
CREATE TABLE IF NOT EXISTS `transaksi` (
  `id`                INT(11)       NOT NULL AUTO_INCREMENT,
  `kode_transaksi`    VARCHAR(50)   NOT NULL,
  `user_id`           INT(11)       NOT NULL,
  `nama_pembeli`      VARCHAR(100)  NOT NULL,
  `total_harga`       DECIMAL(12,2) NOT NULL,
  `metode_pembayaran` ENUM('CASH','QRIS','TRANSFER') NOT NULL,
  `status_pembayaran` ENUM('PENDING','PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `tanggal_transaksi` DATETIME      NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_transaksi`         (`kode_transaksi`),
  KEY `idx_transaksi_tanggal`         (`tanggal_transaksi`),
  KEY `idx_transaksi_status`          (`status_pembayaran`),
  KEY `fk_transaksi_user`             (`user_id`),
  CONSTRAINT `fk_transaksi_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- Table: detail_transaksi
-- =========================================================
CREATE TABLE IF NOT EXISTS `detail_transaksi` (
  `id`           INT(11)       NOT NULL AUTO_INCREMENT,
  `transaksi_id` INT(11)       NOT NULL,
  `produk_id`    INT(11)       NOT NULL,
  `jumlah`       INT(11)       NOT NULL,
  `harga`        DECIMAL(12,2) NOT NULL COMMENT 'snapshot harga saat transaksi',
  `subtotal`     DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_transaksi_produk` (`transaksi_id`, `produk_id`),
  KEY `fk_detail_produk`             (`produk_id`),
  CONSTRAINT `chk_detail_jumlah`   CHECK (`jumlah`   >  0),
  CONSTRAINT `chk_detail_harga`    CHECK (`harga`    >= 0),
  CONSTRAINT `chk_detail_subtotal` CHECK (`subtotal` >= 0),
  CONSTRAINT `fk_detail_transaksi` FOREIGN KEY (`transaksi_id`)
    REFERENCES `transaksi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_produk` FOREIGN KEY (`produk_id`)
    REFERENCES `produk` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;