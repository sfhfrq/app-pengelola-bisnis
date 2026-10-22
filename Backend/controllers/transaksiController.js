const crypto = require("crypto");
const transaksiModel = require("../models/transaksiModel");
const ValidationError = require("../errors/ValidationError");

const METODE_PEMBAYARAN_VALID = ["CASH", "QRIS", "TRANSFER"];

const createTransaksi = async (req, res, next) => {
    try {
        const { nama_pembeli, metode_pembayaran, produk } = req.body || {};

        if (
            typeof nama_pembeli !== "string" ||
            nama_pembeli.trim() === "" ||
            !metode_pembayaran ||
            !produk
        ) {
            throw new ValidationError(
                "Nama pembeli, metode pembayaran, dan produk wajib diisi"
            );
        }

        if (!Array.isArray(produk) || produk.length === 0) {
            throw new ValidationError("Minimal harus ada satu produk");
        }

        if (!METODE_PEMBAYARAN_VALID.includes(metode_pembayaran)) {
            throw new ValidationError(
                `Metode pembayaran tidak valid. Pilihan: ${METODE_PEMBAYARAN_VALID.join(", ")}`
            );
        }

        for (const item of produk) {
            if (
                !item ||
                !Number.isInteger(item.produk_id) ||
                !Number.isInteger(item.jumlah)
            ) {
                throw new ValidationError(
                    "produk_id dan jumlah harus berupa bilangan bulat"
                );
            }
            if (item.produk_id <= 0 || item.jumlah <= 0) {
                throw new ValidationError(
                    "produk_id dan jumlah harus lebih dari 0"
                );
            }
        }

        // Format: TRX-YYYYMMDD-<timestamp>-<6 hex random>
        // Random suffix mencegah tabrakan kode saat dua request dalam
        // milidetik yang sama (Date.now() presisinya cuma milidetik).
        const sekarang = new Date();
        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
        const tanggal = String(sekarang.getDate()).padStart(2, "0");
        const randomSuffix = crypto.randomBytes(3).toString("hex");
        const kodeTransaksi = `TRX-${tahun}${bulan}${tanggal}-${Date.now()}-${randomSuffix}`;

        const transaksi = await transaksiModel.createTransaksi({
            kodeTransaksi,
            userId: req.user.id,
            namaPembeli: nama_pembeli.trim(),
            metodePembayaran: metode_pembayaran,
            produk
        });

        return res.status(201).json({
            pesan: "Transaksi berhasil dibuat",
            data: transaksi
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/transaksi — daftar transaksi + pencarian + filter status + paginasi
const getAllTransaksi = async (req, res, next) => {
    try {
        const cari = req.query.cari || null;
        const status = req.query.status || null;
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        const [transaksi, total] = await Promise.all([
            transaksiModel.getAllTransaksi({ cari, status, limit, offset }),
            transaksiModel.countTransaksi({ cari, status })
        ]);

        res.status(200).json({
            data: transaksi,
            meta: { limit, offset, jumlah: transaksi.length, total }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/transaksi/:id/batal
 *
 * Membatalkan transaksi. Status jadi CANCELLED dan stok produk
 * dikembalikan sebanyak yang terjual. Barisnya TIDAK dihapus, supaya
 * riwayat penjualan tetap bisa diaudit.
 */
const batalkanTransaksi = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new ValidationError("ID tidak valid");
        }

        const hasil = await transaksiModel.batalkanTransaksi(id);

        if (!hasil) {
            return res.status(404).json({ pesan: "Transaksi tidak ditemukan" });
        }

        return res.status(200).json({
            pesan: `Transaksi ${hasil.kode_transaksi} dibatalkan. Stok ${hasil.item_dikembalikan} item dikembalikan.`,
            data: hasil
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTransaksi, getAllTransaksi, batalkanTransaksi };