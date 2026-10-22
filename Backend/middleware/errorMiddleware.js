// 4 parameter (err, req, res, next) — Express mendeteksi error handler
// dari jumlah parameter. Jangan hapus `next`.
const errorMiddleware = (err, req, res, next) => {
    // Error yang kita lempar sendiri dari controller (400)
    if (err.name === "ValidationError") {
        return res.status(400).json({ pesan: err.message });
    }

    // Body JSON rusak dari express.json() — juga kesalahan client (400)
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ pesan: "Format JSON tidak valid" });
    }

    // UNIQUE constraint dari MariaDB → 409
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ pesan: "Data sudah ada (duplikat)" });
    }

    // FOREIGN KEY constraint (produk masih dipakai di transaksi) → 409
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            pesan: "Data tidak bisa dihapus karena masih dipakai"
        });
    }

    // CHECK constraint dari MariaDB → 400
    if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED") {
        return res.status(400).json({
            pesan: "Data melanggar aturan validasi database"
        });
    }

    // Sisanya = bug server. LOG lengkap, tapi JANGAN bocorkan ke user.
    console.error("[error]", err);

    return res.status(500).json({ pesan: "Terjadi kesalahan pada server" });
};

module.exports = errorMiddleware;