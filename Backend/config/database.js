const fs = require("fs");
const mysql = require("mysql2/promise");

/**
 * Pool koneksi MySQL.
 *
 * Semua nilai diambil dari environment supaya kredensial tidak pernah
 * ditulis di kode. Saat development, nilai-nilainya dibaca dari Backend/.env.
 * Saat di-hosting, diisi lewat Environment Variables di dashboard penyedia.
 */

// Sebagian penyedia MySQL cloud MEWAJIBKAN koneksi TLS.
// Nyalakan dengan DB_SSL=true.
const pakaiSsl = String(process.env.DB_SSL || "").toLowerCase() === "true";

/**
 * Sebagian penyedia memakai sertifikat CA sendiri (bukan CA publik),
 * sehingga verifikasi default akan gagal. Untuk kasus itu, simpan berkas
 * CA-nya lalu arahkan DB_SSL_CA ke path berkas tersebut.
 * Verifikasi TLS TIDAK pernah dimatikan — itu akan membuka celah
 * man-in-the-middle ke database.
 */
const opsiSsl = () => {
    if (!pakaiSsl) return undefined;

    const jalurCa = process.env.DB_SSL_CA;
    if (jalurCa && fs.existsSync(jalurCa)) {
        return { ca: fs.readFileSync(jalurCa, "utf8"), rejectUnauthorized: true };
    }

    return { rejectUnauthorized: true };
};

const db = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10, // batasi pool — jangan biarkan tak terbatas
    queueLimit: 0,

    timezone: "+07:00", // WIB — konsisten dengan laporan bisnis Anda
    decimalNumbers: true, // DECIMAL dikembalikan sebagai Number, bukan String

    ...(opsiSsl() ? { ssl: opsiSsl() } : {})
});

module.exports = db;
