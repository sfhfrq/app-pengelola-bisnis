/**
 * Mengganti password pengguna di database.
 *
 *   node gantiPassword.js admin "PasswordBaruYangKuat"
 *
 * WAJIB dijalankan sebelum situs dipublikasikan. Password bawaan
 * (admin123 / budi123) tertulis di README repo publik, jadi siapa pun
 * bisa masuk sebagai admin kalau tidak diganti.
 *
 * Hash memakai bcrypt cost 10 — sama seperti seed.sql, sehingga
 * perbandingan di authController tetap cocok.
 */

require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("./config/database");

(async () => {
    const [nama, sandi] = process.argv.slice(2);

    if (!nama || !sandi) {
        console.error('Pemakaian: node gantiPassword.js <nama> "<password baru>"');
        console.error('Contoh   : node gantiPassword.js admin "RahasiaSekali2026!"');
        process.exit(1);
    }

    if (sandi.length < 8) {
        console.warn(
            "[peringatan] Password kurang dari 8 karakter. Situs ini bisa diakses\n" +
                "             publik, jadi pakai password yang panjang."
        );
    }

    try {
        const hash = await bcrypt.hash(sandi, 10);

        const [hasil] = await db.query("UPDATE users SET password = ? WHERE nama = ?", [
            hash,
            nama
        ]);

        if (hasil.affectedRows === 0) {
            console.error(`[gagal] Pengguna "${nama}" tidak ditemukan.`);
            process.exit(1);
        }

        console.log(`[ok] Password untuk "${nama}" berhasil diganti.`);
        console.log("[ok] Coba login dengan password baru sebelum menutup terminal ini.");
    } catch (error) {
        console.error(`[gagal] ${error.code || ""} ${error.message}`);
        process.exit(1);
    } finally {
        await db.end();
    }
})();
