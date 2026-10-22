const db = require("../config/database");

// Ambang stok menipis — samakan dengan dashboardModel.BATAS_STOK_MENIPIS.
const BATAS_STOK_MENIPIS = 10;

// Filter status dibuat dari WHITELIST, bukan dari input user.
// Nilai dari query string hanya dipakai sebagai KEY untuk memilih
// potongan SQL yang sudah ditulis di sini -> tidak ada celah injection.
const FILTER_STATUS = {
    tersedia: "is_active = 1 AND stok > 10",
    menipis: "is_active = 1 AND stok > 0 AND stok <= 10",
    habis: "is_active = 1 AND stok = 0",
    nonaktif: "is_active = 0"
};

// Ekspresi status yang dikirim ke frontend supaya badge tidak perlu
// menghitung ulang aturan bisnis di sisi klien.
const KOLOM_STATUS = `CASE
        WHEN is_active = 0 THEN 'nonaktif'
        WHEN stok = 0 THEN 'habis'
        WHEN stok <= ${BATAS_STOK_MENIPIS} THEN 'menipis'
        ELSE 'tersedia'
    END AS status`;

/**
 * Menyusun klausa WHERE + parameter dari filter yang diminta.
 * Tanpa `status`, perilaku tetap sama seperti sebelumnya:
 * hanya produk aktif (is_active = 1).
 */
const susunFilter = ({ cari, status }) => {
    const kondisi = [];
    const params = [];

    if (status && FILTER_STATUS[status]) {
        kondisi.push(FILTER_STATUS[status]);
    } else {
        kondisi.push("is_active = 1");
    }

    if (cari) {
        kondisi.push("nama_produk LIKE CONCAT('%', ?, '%')");
        params.push(cari);
    }

    return {
        where: kondisi.length ? `WHERE ${kondisi.join(" AND ")}` : "",
        params
    };
};

// GET semua produk + pencarian + filter status + paginasi
const getAllProduk = async ({ cari = null, status = null, limit = 20, offset = 0 } = {}) => {
    const { where, params } = susunFilter({ cari, status });

    const [rows] = await db.query(
        `SELECT id, nama_produk, harga, stok, is_active, created_at, ${KOLOM_STATUS}
         FROM produk
         ${where}
         ORDER BY id
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    return rows;
};

// Jumlah total baris untuk filter yang sama — dipakai frontend
// menghitung jumlah halaman. Sengaja terpisah dari getAllProduk
// supaya paginasi tidak salah hitung.
const countProduk = async ({ cari = null, status = null } = {}) => {
    const { where, params } = susunFilter({ cari, status });

    const [rows] = await db.query(
        `SELECT COUNT(*) AS total FROM produk ${where}`,
        params
    );
    return Number(rows[0]?.total) || 0;
};

// GET produk berdasarkan ID
const getProdukById = async (id) => {
    const [rows] = await db.query(
        `SELECT id, nama_produk, harga, stok, is_active FROM produk
         WHERE id = ? AND is_active = 1
         LIMIT 1`,
        [id]
    );
    return rows[0];
};

// POST produk
const createProduk = async ({ nama_produk, harga, stok }) => {
    const [result] = await db.query(
        `INSERT INTO produk (nama_produk, harga, stok)
         VALUES (?, ?, ?)`,
        [nama_produk, harga, stok]
    );
    return result;
};

// PUT produk
const updateProduk = async (id, { nama_produk, harga, stok }) => {
    const [result] = await db.query(
        `UPDATE produk
         SET nama_produk = ?, harga = ?, stok = ?
         WHERE id = ? AND is_active = 1`,
        [nama_produk, harga, stok, id]
    );
    return result;
};

// DELETE = SOFT DELETE (produk tidak benar-benar dihapus)
const deleteProduk = async (id) => {
    const [result] = await db.query(
        `UPDATE produk SET is_active = 0
         WHERE id = ? AND is_active = 1`,
        [id]
    );
    return result;
};

module.exports = {
    BATAS_STOK_MENIPIS,
    getAllProduk,
    countProduk,
    getProdukById,
    createProduk,
    updateProduk,
    deleteProduk
};
