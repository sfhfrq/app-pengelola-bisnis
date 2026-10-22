/**
 * Seed data demo untuk App Pengelola Bisnis.
 *
 *   node seedDemo.js          -> pasang data demo
 *   node seedDemo.js --hapus  -> hapus SEMUA data demo
 *
 * KEAMANAN DATA
 * Semua baris demo memakai rentang id 900+ dan kode transaksi berawalan
 * "DEMO-". Data asli milik Anda (produk id 1..899, transaksi id 1..899)
 * TIDAK PERNAH disentuh, baik saat memasang maupun saat menghapus.
 *
 * CATATAN STOK
 * Seed ini menulis detail transaksi secara langsung tanpa mengurangi stok
 * produk, karena transaksi demo adalah data historis buatan. Stok produk
 * demo ditulis eksplisit di bawah supaya kartu "Stok Menipis" tetap terisi.
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const ID_MIN = 900;
const ID_MAKS = 999;

// ---------------------------------------------------------------
// Produk demo (harga dalam rupiah)
// ---------------------------------------------------------------
const PRODUK_DEMO = [
    { id: 901, nama: "Kopi Kapal Api Sachet", harga: 2000, stok: 48 },
    { id: 902, nama: "Teh Kotak 200ml", harga: 4500, stok: 8 },   // menipis
    { id: 903, nama: "Minyak Goreng 1L", harga: 17000, stok: 0 },  // habis
    { id: 904, nama: "Beras Premium 5kg", harga: 68000, stok: 12 },
    { id: 905, nama: "Gula Pasir 1kg", harga: 15000, stok: 30 }
];

// ---------------------------------------------------------------
// Transaksi demo — tersebar Januari..Oktober 2026
// (tidak ada tanggal di masa depan; hari ini 13 Oktober 2026)
// ---------------------------------------------------------------
const TRANSAKSI_DEMO = [
    { tanggal: "2026-01-14 09:20:00", user: 1, pembeli: "Andi Wijaya",     metode: "CASH",     status: "PAID",      items: [[1, 4], [901, 6]] },
    { tanggal: "2026-02-08 13:45:00", user: 2, pembeli: "Siti Rahma",      metode: "QRIS",     status: "PAID",      items: [[2, 3], [902, 2]] },
    { tanggal: "2026-03-19 10:05:00", user: 1, pembeli: "Budi Santoso",    metode: "TRANSFER", status: "PAID",      items: [[1, 6], [904, 1]] },
    { tanggal: "2026-04-02 16:30:00", user: 2, pembeli: "Dewi Lestari",    metode: "CASH",     status: "PAID",      items: [[901, 10]] },
    { tanggal: "2026-04-15 11:15:00", user: 2, pembeli: "Budi Santoso",    metode: "QRIS",     status: "CANCELLED", items: [[902, 1]] },
    { tanggal: "2026-05-21 08:15:00", user: 1, pembeli: "Rizky Pratama",   metode: "QRIS",     status: "PAID",      items: [[2, 5], [905, 2]] },
    { tanggal: "2026-06-11 14:50:00", user: 2, pembeli: "Andi Wijaya",     metode: "CASH",     status: "PAID",      items: [[1, 8], [902, 3], [905, 1]] },
    { tanggal: "2026-07-07 11:10:00", user: 1, pembeli: "Putri Handayani", metode: "TRANSFER", status: "PAID",      items: [[904, 2]] },
    { tanggal: "2026-08-23 09:40:00", user: 2, pembeli: "Fajar Nugroho",   metode: "CASH",     status: "PAID",      items: [[1, 5], [901, 4]] },
    { tanggal: "2026-08-28 15:25:00", user: 1, pembeli: "Siti Rahma",      metode: "QRIS",     status: "PAID",      items: [[2, 6], [905, 2]] },
    { tanggal: "2026-09-05 10:35:00", user: 2, pembeli: "Intan Permata",   metode: "CASH",     status: "PAID",      items: [[901, 12], [902, 4]] },
    { tanggal: "2026-09-27 13:05:00", user: 1, pembeli: "Bagus Setiawan",  metode: "TRANSFER", status: "PAID",      items: [[904, 1], [905, 3]] },
    { tanggal: "2026-10-06 09:00:00", user: 2, pembeli: "Dewi Lestari",    metode: "QRIS",     status: "PAID",      items: [[1, 10], [2, 4]] },
    // Tiga transaksi QRIS berikut tetap PENDING supaya panel
    // "Menunggu Pembayaran" terisi seperti di desain referensi.
    { tanggal: "2026-10-11 15:50:00", user: 1, pembeli: "Putri Handayani", metode: "QRIS",     status: "PENDING",   items: [[902, 2], [905, 1]] },
    { tanggal: "2026-10-12 10:20:00", user: 1, pembeli: "Fajar Nugroho",   metode: "QRIS",     status: "PENDING",   items: [[904, 1]] },
    { tanggal: "2026-10-13 11:40:00", user: 1, pembeli: "Intan Permata",   metode: "QRIS",     status: "PENDING",   items: [[1, 3], [901, 2]] }
];

const PAD = (n, lebar) => String(n).padStart(lebar, "0");
const rp = (n) => Number(n).toFixed(2);

/** Semua produk yang dipakai di rincian transaksi demo (asli + demo). */
const ID_PRODUK_DIPAKAI = [
    ...new Set([
        ...TRANSAKSI_DEMO.flatMap((t) => t.items.map(([id]) => id)),
        ...PRODUK_DEMO.map((p) => p.id)
    ])
].sort((a, b) => a - b);

/** Menyusun seluruh pernyataan SQL. Dipakai untuk menulis file .sql sekaligus untuk dieksekusi. */
const susunSql = (hargaMap) => {
    const baris = [];
    const tambah = (sql) => baris.push(sql);

    tambah("-- =========================================================");
    tambah("-- Seed data DEMO — App Pengelola Bisnis");
    tambah("-- Hanya menyentuh id 900-999 dan kode berawalan 'DEMO-'.");
    tambah("-- Jalankan 'node seedDemo.js --hapus' untuk membersihkan.");
    tambah("-- =========================================================");
    tambah("USE `pengelola_bisnis`;");
    tambah("");

    // --- Bersihkan demo lama supaya skrip ini bisa dijalankan berulang ---
    tambah("-- Hapus demo lama (detail ikut terhapus lewat ON DELETE CASCADE)");
    tambah("DELETE FROM `transaksi` WHERE `kode_transaksi` LIKE 'DEMO-%';");
    tambah(`DELETE FROM \`produk\` WHERE \`id\` BETWEEN ${ID_MIN} AND ${ID_MAKS};`);
    tambah("");

    // --- Produk demo ---
    tambah("-- Produk demo");
    tambah(
        "INSERT INTO `produk` (`id`, `nama_produk`, `harga`, `stok`, `is_active`) VALUES\n" +
            PRODUK_DEMO.map(
                (p) => `  (${p.id}, '${p.nama}', ${rp(p.harga)}, ${p.stok}, 1)`
            ).join(",\n") +
            ";"
    );
    tambah("");

    // --- Transaksi + detail ---
    tambah("-- Transaksi demo + rincian item");

    const nilaiTransaksi = [];
    const nilaiDetail = [];

    TRANSAKSI_DEMO.forEach((t, idx) => {
        const id = 901 + idx;
        const kode = `DEMO-2026-${PAD(idx + 1, 4)}`;

        let total = 0;
        for (const [produkId, jumlah] of t.items) {
            const harga = hargaMap.get(produkId);
            if (harga === undefined) {
                throw new Error(
                    `Produk ${produkId} tidak ditemukan di tabel produk — jalankan seed.sql dulu`
                );
            }
            total += harga * jumlah;
            nilaiDetail.push(
                `  (${id}, ${produkId}, ${jumlah}, ${rp(harga)}, ${rp(harga * jumlah)})`
            );
        }

        nilaiTransaksi.push(
            `  (${id}, '${kode}', ${t.user}, '${t.pembeli}', ${rp(total)}, ` +
                `'${t.metode}', '${t.status}', '${t.tanggal}')`
        );

        tambah(`-- ${kode} — ${t.pembeli} (${t.status}, ${rp(total)})`);
    });

    tambah(
        "INSERT INTO `transaksi`\n" +
            "  (`id`, `kode_transaksi`, `user_id`, `nama_pembeli`, `total_harga`, `metode_pembayaran`, `status_pembayaran`, `tanggal_transaksi`)\n" +
            "VALUES\n" +
            nilaiTransaksi.join(",\n") +
            ";"
    );
    tambah("");

    tambah(
        "INSERT INTO `detail_transaksi`\n" +
            "  (`transaksi_id`, `produk_id`, `jumlah`, `harga`, `subtotal`)\n" +
            "VALUES\n" +
            nilaiDetail.join(",\n") +
            ";"
    );
    tambah("");

    return { sql: baris.join("\n"), jumlahTransaksi: TRANSAKSI_DEMO.length };
};

const SUSUN_HAPUS = () => [
    "USE `pengelola_bisnis`;",
    "DELETE FROM `transaksi` WHERE `kode_transaksi` LIKE 'DEMO-%';",
    `DELETE FROM \`produk\` WHERE \`id\` BETWEEN ${ID_MIN} AND ${ID_MAKS};`
];

const pecahPernyataan = (sql) =>
    sql
        .split("\n")
        .filter((l) => !l.trim().startsWith("--"))
        .join("\n")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

(async () => {
    const modeHapus = process.argv.includes("--hapus");

    const koneksi = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: false
    });

    try {
        if (modeHapus) {
            for (const pernyataan of SUSUN_HAPUS()) {
                await koneksi.query(pernyataan);
            }
            console.log("[seed] Data demo dihapus (id 900-999, kode DEMO-*).");
            return;
        }

        // Harga untuk produk yang SUDAH ada (mis. Indomie, Aqua) diambil dari
        // tabel produk supaya snapshot `harga` di detail_transaksi benar.
        // Produk demo belum ada di database, jadi harganya dari konstanta.
        const idSudahAda = ID_PRODUK_DIPAKAI.filter(
            (id) => !PRODUK_DEMO.some((p) => p.id === id)
        );

        const hargaMap = new Map(PRODUK_DEMO.map((p) => [p.id, p.harga]));

        if (idSudahAda.length > 0) {
            const [produkDb] = await koneksi.query(
                `SELECT id, harga FROM produk WHERE id IN (${idSudahAda.map(() => "?").join(",")})`,
                idSudahAda
            );
            for (const p of produkDb) hargaMap.set(p.id, Number(p.harga));
        }

        const { sql, jumlahTransaksi } = susunSql(hargaMap);

        // Simpan juga versi .sql supaya bisa dijalankan manual lewat phpMyAdmin.
        const berkas = path.join(__dirname, "..", "database", "seed_demo.sql");
        fs.writeFileSync(berkas, `${sql}\n`, "utf8");
        console.log(`[seed] Ditulis: ${berkas}`);

        for (const pernyataan of pecahPernyataan(sql)) {
            await koneksi.query(pernyataan);
        }

        console.log(
            `[seed] Selesai: ${PRODUK_DEMO.length} produk demo + ${jumlahTransaksi} transaksi demo.`
        );
        console.log("[seed] Hapus kapan saja dengan: node seedDemo.js --hapus");
    } finally {
        await koneksi.end();
    }
})().catch((error) => {
    console.error("[seed] Gagal:", error.message);
    process.exit(1);
});
