const db = require("../config/database");

// INSERT banyak item sekaligus dalam SATU query (bulk insert).
// Menerima `connection` dari pemanggil karena query ini harus berada
// di dalam transaction yang sama dengan INSERT transaksi induk.
const insertItems = async (connection, transaksiId, items) => {
    const values = items.map((it) => [
        transaksiId,
        it.produk_id,
        it.jumlah,
        it.harga,
        it.subtotal
    ]);

    await connection.query(
        `INSERT INTO detail_transaksi
         (transaksi_id, produk_id, jumlah, harga, subtotal)
         VALUES ?`,
        [values]
    );
};

// Ambil semua item dari satu transaksi.
// PENTING: JANGAN filter p.is_active = 1 di sini.
// Produk yang sudah di-soft-delete tetap harus muncul di nota lama.
const getItemsByTransaksiId = async (transaksiId) => {
    const [rows] = await db.query(
        `SELECT dt.produk_id, p.nama_produk, dt.jumlah, dt.harga, dt.subtotal
         FROM detail_transaksi dt
         JOIN produk p ON p.id = dt.produk_id
         WHERE dt.transaksi_id = ?
         ORDER BY dt.id`,
        [transaksiId]
    );
    return rows;
};

module.exports = { insertItems, getItemsByTransaksiId };