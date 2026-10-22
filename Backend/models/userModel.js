const db = require("../config/database");

// Cari user berdasarkan nama
const getUserByNama = async (nama) => {
    const [rows] = await db.query(
        `SELECT id, nama, password, role
         FROM users
         WHERE nama = ?
         LIMIT 1`,
        [nama]
    );
    return rows[0];
};

// Daftar semua user — TANPA kolom password.
// Hash password tidak pernah keluar dari database, bahkan untuk admin.
const getAllUsers = async () => {
    const [rows] = await db.query(
        `SELECT u.id, u.nama, u.role, u.created_at,
                (SELECT COUNT(*) FROM transaksi t WHERE t.user_id = u.id) AS jumlah_transaksi
         FROM users u
         ORDER BY u.id`
    );
    return rows;
};

module.exports = {
    getUserByNama,
    getAllUsers
};
