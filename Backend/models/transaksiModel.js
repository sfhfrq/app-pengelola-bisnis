const db = require("../config/database");
const ValidationError = require("../errors/ValidationError");
const detailTransaksiModel = require("./detailTransaksiModel");

const createTransaksi = async ({
    kodeTransaksi,
    userId,
    namaPembeli,
    metodePembayaran,
    produk
}) => {
    const connection = await db.getConnection();

    try {
        // LANGKAH 1 — BUKA TRANSAKSI PALING AWAL
        // SELECT ... FOR UPDATE hanya mengunci baris selama transaksi aktif.
        // Di mode autocommit, lock langsung dilepas → race condition.
        await connection.beginTransaction();

        // LANGKAH 2 — NORMALISASI CART (gabungkan produk duplikat)
        // Hash Map → lookup O(1), total O(N). Array.find() → O(N²).
        const qtyPerProduk = new Map();
        for (const item of produk) {
            qtyPerProduk.set(
                item.produk_id,
                (qtyPerProduk.get(item.produk_id) || 0) + item.jumlah
            );
        }

        // LANGKAH 3 — KUNCI BARIS DENGAN URUTAN KONSISTEN
        // sort() penting: InnoDB mengunci baris satu per satu. Kalau
        // transaksi A kunci (5,7) dan B kunci (7,5), saling tunggu → DEADLOCK.
        const produkIds = [...qtyPerProduk.keys()].sort((a, b) => a - b);
        const placeholders = produkIds.map(() => "?").join(",");

        const [produkRows] = await connection.query(
            `SELECT id, nama_produk, harga, stok
             FROM produk
             WHERE id IN (${placeholders}) AND is_active = 1
             FOR UPDATE`,
            produkIds
        );

        if (produkRows.length !== produkIds.length) {
            throw new ValidationError("Ada produk yang tidak ditemukan");
        }

        // LANGKAH 4 — HITUNG SUBTOTAL
        const produkMap = new Map(produkRows.map((p) => [p.id, p]));

        let totalHarga = 0;
        const detailTransaksi = [];

        for (const [produkId, jumlah] of qtyPerProduk) {
            const p = produkMap.get(produkId);

            if (p.stok < jumlah) {
                throw new ValidationError(`Stok ${p.nama_produk} tidak mencukupi`);
            }

            const subtotal = Number(p.harga) * jumlah;
            totalHarga += subtotal;

            detailTransaksi.push({
                produk_id: p.id,
                jumlah,
                harga: p.harga,
                subtotal
            });
        }

        // LANGKAH 5 — INSERT TRANSAKSI UTAMA
        // status_pembayaran EKSPLISIT — jangan bergantung pada DEFAULT.
        const statusPembayaran = metodePembayaran === "QRIS" ? "PENDING" : "PAID";

        const [trxResult] = await connection.query(
            `INSERT INTO transaksi
             (kode_transaksi, user_id, nama_pembeli, total_harga,
              metode_pembayaran, status_pembayaran)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                kodeTransaksi,
                userId,
                namaPembeli,
                totalHarga,
                metodePembayaran,
                statusPembayaran
            ]
        );

        const transaksiId = trxResult.insertId;

        // LANGKAH 6 — INSERT DETAIL (bulk, satu query)
        // Menggunakan connection yang sama supaya ikut rollback.
        await detailTransaksiModel.insertItems(
            connection,
            transaksiId,
            detailTransaksi
        );

        // LANGKAH 7 — KURANGI STOK (satu query UPDATE ... CASE)
        // Guard `stok >= CASE ... END` adalah cek atomik di level database.
        const caseSet = produkIds.map(() => "WHEN ? THEN stok - ?").join(" ");
        const caseGuard = produkIds.map(() => "WHEN ? THEN ?").join(" ");

        const setParams = [];
        const guardParams = [];
        for (const id of produkIds) {
            const qty = qtyPerProduk.get(id);
            setParams.push(id, qty);
            guardParams.push(id, qty);
        }

        const [updResult] = await connection.query(
            `UPDATE produk
             SET stok = CASE id ${caseSet} END
             WHERE id IN (${placeholders})
               AND stok >= CASE id ${caseGuard} END`,
            [...setParams, ...produkIds, ...guardParams]
        );

        if (updResult.affectedRows !== produkIds.length) {
            throw new ValidationError("Stok berubah atau tidak mencukupi");
        }

        // LANGKAH 8 — COMMIT
        await connection.commit();

        return {
            id: transaksiId,
            kode_transaksi: kodeTransaksi,
            total_harga: totalHarga,
            status_pembayaran: statusPembayaran
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        // WAJIB. Tanpa ini, koneksi tidak kembali ke pool → pool habis.
        connection.release();
    }
};

// Ambil header transaksi saja (tanpa item).
// Items diambil terpisah oleh detailTransaksiModel.getItemsByTransaksiId().
const getTransaksiHeaderById = async (id) => {
    const [rows] = await db.query(
        `SELECT t.id, t.kode_transaksi, t.nama_pembeli, t.total_harga,
                t.metode_pembayaran, t.status_pembayaran, t.tanggal_transaksi,
                u.id AS kasir_id, u.nama AS kasir_nama
         FROM transaksi t
         JOIN users u ON u.id = t.user_id
         WHERE t.id = ?
         LIMIT 1`,
        [id]
    );

    if (rows.length === 0) return null;

    const h = rows[0];
    return {
        id: h.id,
        kode_transaksi: h.kode_transaksi,
        nama_pembeli: h.nama_pembeli,
        total_harga: h.total_harga,
        metode_pembayaran: h.metode_pembayaran,
        status_pembayaran: h.status_pembayaran,
        tanggal_transaksi: h.tanggal_transaksi,
        kasir: { id: h.kasir_id, nama: h.kasir_nama }
    };
};

// =========================================================
// DAFTAR TRANSAKSI (untuk halaman "Transaksi" di frontend)
// =========================================================

// Whitelist filter status — nilai query hanya dipakai sebagai key.
const FILTER_STATUS = {
    PENDING: "t.status_pembayaran = 'PENDING'",
    PAID: "t.status_pembayaran = 'PAID'",
    CANCELLED: "t.status_pembayaran = 'CANCELLED'"
};

const susunFilter = ({ cari, status }) => {
    const kondisi = [];
    const params = [];

    if (status && FILTER_STATUS[status]) {
        kondisi.push(FILTER_STATUS[status]);
    }

    if (cari) {
        kondisi.push("(t.kode_transaksi LIKE CONCAT('%', ?, '%') OR t.nama_pembeli LIKE CONCAT('%', ?, '%'))");
        params.push(cari, cari);
    }

    return {
        where: kondisi.length ? `WHERE ${kondisi.join(" AND ")}` : "",
        params
    };
};

const getAllTransaksi = async ({ cari = null, status = null, limit = 20, offset = 0 } = {}) => {
    const { where, params } = susunFilter({ cari, status });

    const [rows] = await db.query(
        `SELECT t.id, t.kode_transaksi, t.nama_pembeli, t.total_harga,
                t.metode_pembayaran, t.status_pembayaran, t.tanggal_transaksi,
                u.nama AS kasir_nama,
                (SELECT COALESCE(SUM(dt.jumlah), 0)
                   FROM detail_transaksi dt
                  WHERE dt.transaksi_id = t.id) AS total_item
         FROM transaksi t
         JOIN users u ON u.id = t.user_id
         ${where}
         ORDER BY t.tanggal_transaksi DESC, t.id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    return rows;
};

const countTransaksi = async ({ cari = null, status = null } = {}) => {
    const { where, params } = susunFilter({ cari, status });

    const [rows] = await db.query(
        `SELECT COUNT(*) AS total FROM transaksi t ${where}`,
        params
    );
    return Number(rows[0]?.total) || 0;
};

// =========================================================
// PEMBATALAN TRANSAKSI
// =========================================================

/**
 * Membatalkan transaksi dan MENGEMBALIKAN stok produknya.
 *
 * Kenapa memakai baris terkunci (FOR UPDATE):
 * Tanpa kunci, dua permintaan pembatalan yang datang bersamaan bisa
 * sama-sama lolos pemeriksaan "belum dibatalkan", lalu sama-sama
 * mengembalikan stok — stok jadi berlebih dan tidak sesuai kenyataan.
 * Kunci pada baris `transaksi` membuat pembatalan kedua menunggu,
 * lalu melihat statusnya sudah CANCELLED dan ditolak.
 *
 * Mengembalikan `null` kalau transaksinya tidak ada (controller -> 404),
 * dan melempar ValidationError kalau sudah pernah dibatalkan.
 */
const batalkanTransaksi = async (id) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [header] = await connection.query(
            `SELECT id, kode_transaksi, status_pembayaran
             FROM transaksi
             WHERE id = ?
             FOR UPDATE`,
            [id]
        );

        if (header.length === 0) {
            await connection.rollback();
            return null;
        }

        if (header[0].status_pembayaran === "CANCELLED") {
            throw new ValidationError("Transaksi ini sudah dibatalkan sebelumnya");
        }

        // ORDER BY produk_id: urutan kunci baris dibuat konsisten di semua
        // transaksi, supaya tidak saling tunggu (deadlock) dengan penjualan
        // yang sedang berjalan.
        const [items] = await connection.query(
            `SELECT produk_id, jumlah
             FROM detail_transaksi
             WHERE transaksi_id = ?
             ORDER BY produk_id`,
            [id]
        );

        let itemDikembalikan = 0;

        for (const item of items) {
            // Produk yang sudah di-soft-delete tetap punya baris di tabel,
            // jadi stoknya tetap bisa dikembalikan.
            await connection.query(
                `UPDATE produk SET stok = stok + ? WHERE id = ?`,
                [item.jumlah, item.produk_id]
            );
            itemDikembalikan += item.jumlah;
        }

        await connection.query(
            `UPDATE transaksi SET status_pembayaran = 'CANCELLED' WHERE id = ?`,
            [id]
        );

        await connection.commit();

        return {
            id: header[0].id,
            kode_transaksi: header[0].kode_transaksi,
            status_pembayaran: "CANCELLED",
            item_dikembalikan: itemDikembalikan
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    createTransaksi,
    getTransaksiHeaderById,
    getAllTransaksi,
    countTransaksi,
    batalkanTransaksi
};