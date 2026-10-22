/**
 * Menyiapkan struktur tabel + data awal di database mana pun yang
 * dikonfigurasi lewat environment (termasuk MySQL cloud).
 *
 *   node dbSetup.js
 *
 * Kenapa perlu skrip ini?
 * Berkas database/schema.sql diawali `CREATE DATABASE` dan `USE`. Di MySQL
 * cloud, database biasanya sudah dibuat oleh penyedia dan akun kita tidak
 * punya izin CREATE DATABASE. Skrip ini membuang pernyataan itu lalu
 * menjalankan sisanya terhadap database yang ada di DB_NAME.
 *
 * Aman dijalankan berulang: schema.sql memakai CREATE TABLE IF NOT EXISTS,
 * dan seed.sql dilindungi pemeriksaan "sudah ada isinya atau belum".
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const FOLDER_DATABASE = path.join(__dirname, "..", "database");

/**
 * Menyiapkan daftar pernyataan SQL yang aman dijalankan di database mana pun.
 *
 * Urutannya penting: pecah per ";" DULU, baru saring pernyataannya.
 * Kalau menyaring per baris, `CREATE DATABASE ... DEFAULT CHARACTER SET ...`
 * yang ditulis dua baris akan terpotong dan menyisakan SQL yatim
 * (ERR_PARSE_ERROR). Itu pernah terjadi saat skrip ini diuji.
 */
const siapkanPernyataan = (isi) => {
    // Buang komentar baris lebih dulu supaya ";" di dalam komentar tidak
    // ikut memecah pernyataan.
    const tanpaKomentar = isi
        .split("\n")
        .filter((baris) => !baris.trim().startsWith("--"))
        .join("\n");

    return (
        tanpaKomentar
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean)
            // Di MySQL cloud, database sudah dibuat oleh penyedia dan akun
            // kita biasanya tidak punya izin CREATE DATABASE.
            .filter((s) => !/^CREATE\s+DATABASE/i.test(s))
            .filter((s) => !/^USE\b/i.test(s))
    );
};

const jalankanBerkas = async (koneksi, namaBerkas) => {
    const jalur = path.join(FOLDER_DATABASE, namaBerkas);
    if (!fs.existsSync(jalur)) {
        console.log(`[db] Lewati ${namaBerkas} (berkas tidak ada)`);
        return 0;
    }

    const pernyataan = siapkanPernyataan(fs.readFileSync(jalur, "utf8"));

    for (const p of pernyataan) {
        await koneksi.query(p);
    }
    return pernyataan.length;
};

(async () => {
    const nama = process.env.DB_NAME;
    if (!nama) {
        console.error("[db] DB_NAME belum diisi. Salin .env.example menjadi .env dulu.");
        process.exit(1);
    }

    console.log(
        `[db] Menyiapkan database "${nama}" di ${process.env.DB_HOST}:${
            process.env.DB_PORT || 3306
        } (TLS: ${String(process.env.DB_SSL).toLowerCase() === "true" ? "ya" : "tidak"})`
    );

    // Salin konfigurasi SSL yang sama seperti config/database.js.
    const db = require("./config/database");

    let koneksi;
    try {
        koneksi = await db.getConnection();
    } catch (error) {
        console.error(`\n[db] GAGAL terhubung: ${error.code || ""} ${error.message}\n`);
        if (error.code === "ER_BAD_DB_ERROR") {
            console.error(
                `[db] Database "${nama}" belum ada. Buat dulu di dashboard penyedia\n` +
                    "     (mis. TiDB Cloud / Aiven / Railway), lalu jalankan ulang skrip ini."
            );
        }
        if (error.code === "ER_ACCESS_DENIED_ERROR") {
            console.error("[db] DB_USER atau DB_PASSWORD salah.");
        }
        if (["HANDSHAKE_SSL_ERROR", "UNABLE_TO_VERIFY_LEAF_SIGNATURE"].includes(error.code)) {
            console.error(
                "[db] Masalah TLS. Kalau penyedia memakai CA sendiri,\n" +
                    "     unduh berkas CA-nya lalu set DB_SSL_CA ke path berkas itu."
            );
        }
        process.exit(1);
    }

    try {
        const jumlahTabel = await jalankanBerkas(koneksi, "schema.sql");
        console.log(`[db] Struktur tabel siap (${jumlahTabel} pernyataan).`);

        // Seed hanya kalau tabel users masih kosong — supaya menjalankan
        // ulang skrip ini tidak menimpa data yang sudah ada.
        const [cek] = await koneksi.query("SELECT COUNT(*) AS n FROM users");
        if (cek[0].n === 0) {
            const jumlahSeed = await jalankanBerkas(koneksi, "seed.sql");
            console.log(`[db] Data awal dimasukkan (${jumlahSeed} pernyataan).`);
        } else {
            console.log(`[db] Tabel users sudah berisi ${cek[0].n} baris — seed dilewati.`);
        }

        const [users] = await koneksi.query("SELECT nama, role FROM users ORDER BY id");
        const [produk] = await koneksi.query("SELECT COUNT(*) AS n FROM produk");
        const [transaksi] = await koneksi.query("SELECT COUNT(*) AS n FROM transaksi");

        console.log("\n[db] Ringkasan:");
        console.table(users);
        console.log(
            `     produk: ${produk[0].n} baris | transaksi: ${transaksi[0].n} baris`
        );
        console.log("\n[db] Selesai. Akun awal: admin/admin123 dan budi/budi123.");
        console.log("[db] GANTI password itu setelah situs Anda online.\n");
    } catch (error) {
        console.error(`\n[db] Gagal menjalankan SQL: ${error.code || ""} ${error.message}`);
        process.exit(1);
    } finally {
        koneksi.release();
        await db.end();
    }
})();
