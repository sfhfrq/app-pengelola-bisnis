const db = require("../config/database");

// Ambang "stok menipis". Dipakai konsisten oleh kartu statistik
// dan filter status di tabel produk.
const BATAS_STOK_MENIPIS = 10;

const LABEL_BULAN = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

/**
 * Enam angka untuk kartu "Quick Stats".
 * Semua dihitung di database (satu round-trip), bukan di JavaScript,
 * supaya tetap benar walau data sudah besar.
 */
const getStatistik = async () => {
    const [rows] = await db.query(
        `SELECT
            (SELECT COUNT(*) FROM users) AS total_pengguna,
            (SELECT COUNT(*) FROM produk WHERE is_active = 1) AS total_produk,
            (SELECT COUNT(*) FROM transaksi
              WHERE YEAR(tanggal_transaksi) = YEAR(CURDATE())
                AND MONTH(tanggal_transaksi) = MONTH(CURDATE())
            ) AS transaksi_bulan_ini,
            (SELECT COUNT(*) FROM transaksi) AS total_transaksi,
            (SELECT COUNT(*) FROM transaksi
              WHERE status_pembayaran = 'PENDING'
            ) AS transaksi_pending,
            (SELECT COUNT(*) FROM produk
              WHERE is_active = 1 AND stok <= ?) AS stok_menipis,
            (SELECT COALESCE(SUM(total_harga), 0) FROM transaksi
              WHERE status_pembayaran = 'PAID') AS total_pendapatan`,
        [BATAS_STOK_MENIPIS]
    );

    const s = rows[0] || {};

    // mysql2 bisa mengembalikan COUNT(*) sebagai angka; pastikan tetap Number.
    return {
        total_pengguna: Number(s.total_pengguna) || 0,
        total_produk: Number(s.total_produk) || 0,
        transaksi_bulan_ini: Number(s.transaksi_bulan_ini) || 0,
        total_transaksi: Number(s.total_transaksi) || 0,
        transaksi_pending: Number(s.transaksi_pending) || 0,
        stok_menipis: Number(s.stok_menipis) || 0,
        total_pendapatan: Number(s.total_pendapatan) || 0,
        batas_stok_menipis: BATAS_STOK_MENIPIS
    };
};

/**
 * Dua deret data per bulan selama satu tahun:
 *  - jumlah_transaksi : berapa transaksi terjadi
 *  - produk_terjual   : berapa unit produk terjual
 *
 * LEFT JOIN dipakai supaya bulan tanpa transaksi tetap muncul sebagai 0,
 * bukan hilang dari hasil. Lubang diisi di JavaScript.
 */
const getGrafikTahunan = async (tahun) => {
    const [rows] = await db.query(
        `SELECT
            MONTH(t.tanggal_transaksi) AS bulan,
            COUNT(DISTINCT t.id) AS jumlah_transaksi,
            COALESCE(SUM(dt.jumlah), 0) AS produk_terjual
         FROM transaksi t
         LEFT JOIN detail_transaksi dt ON dt.transaksi_id = t.id
         WHERE YEAR(t.tanggal_transaksi) = ?
         GROUP BY MONTH(t.tanggal_transaksi)
         ORDER BY bulan`,
        [tahun]
    );

    const transaksi = new Array(12).fill(0);
    const produkTerjual = new Array(12).fill(0);

    for (const r of rows) {
        const idx = Number(r.bulan) - 1;
        if (idx < 0 || idx > 11) continue;
        transaksi[idx] = Number(r.jumlah_transaksi) || 0;
        produkTerjual[idx] = Number(r.produk_terjual) || 0;
    }

    return {
        tahun,
        label_bulan: LABEL_BULAN,
        transaksi,
        produk_terjual: produkTerjual
    };
};

/**
 * Panel "Menunggu Pembayaran" — transaksi yang belum lunas.
 * QRIS otomatis berstatus PENDING saat dibuat (lihat transaksiModel),
 * jadi panel ini memang punya isi di pemakaian normal.
 */
const getMenungguPembayaran = async (limit = 5) => {
    const [rows] = await db.query(
        `SELECT id, kode_transaksi, nama_pembeli, total_harga,
                metode_pembayaran, status_pembayaran, tanggal_transaksi
         FROM transaksi
         WHERE status_pembayaran = 'PENDING'
         ORDER BY tanggal_transaksi DESC, id DESC
         LIMIT ?`,
        [limit]
    );
    return rows;
};

/** Total pendapatan per bulan (dipakai untuk ringkasan di kartu grafik). */
const getTotalPendapatanTahun = async (tahun) => {
    const [rows] = await db.query(
        `SELECT COALESCE(SUM(total_harga), 0) AS total
         FROM transaksi
         WHERE YEAR(tanggal_transaksi) = ?`,
        [tahun]
    );
    return Number(rows[0]?.total) || 0;
};

module.exports = {
    BATAS_STOK_MENIPIS,
    getStatistik,
    getGrafikTahunan,
    getMenungguPembayaran,
    getTotalPendapatanTahun
};
