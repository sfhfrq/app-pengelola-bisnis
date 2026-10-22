/**
 * CORS buatan sendiri — sengaja TIDAK memakai paket `cors`.
 *
 * Kapan ini dibutuhkan?
 * Saat frontend dan backend berada di origin berbeda, misalnya:
 *   frontend : https://namaanda.github.io
 *   backend  : https://pengelola-bisnis-api.onrender.com
 * Browser akan memblokir permintaan lintas origin kecuali backend
 * mengizinkannya lewat header Access-Control-Allow-*.
 *
 * Saat development lokal, frontend di :5173 memakai proxy Vite ke :3000
 * sehingga browser melihat satu origin saja — middleware ini tidak aktif
 * berperan, jadi alur lokal tidak terpengaruh.
 *
 * Daftar origin yang diizinkan diambil dari environment CORS_ORIGIN,
 * dipisah koma. Contoh:
 *   CORS_ORIGIN=https://namaanda.github.io,https://domain-sendiri.com
 *
 * Kalau CORS_ORIGIN tidak diisi:
 *   - mode development -> localhost:5173 diizinkan (memudahkan mencoba)
 *   - mode production  -> tidak ada origin yang diizinkan (aman secara bawaan)
 */

const BAWAAN_DEV = "http://localhost:5173,http://127.0.0.1:5173";

const mentah =
    process.env.CORS_ORIGIN ||
    (process.env.NODE_ENV === "production" ? "" : BAWAAN_DEV);

const DAFTAR_ASAL = mentah
    .split(",")
    .map((s) => s.trim().replace(/\/$/, "")) // buang garis miring di akhir
    .filter(Boolean);

if (process.env.NODE_ENV === "production" && DAFTAR_ASAL.length === 0) {
    console.warn(
        "[cors] PERINGATAN: CORS_ORIGIN belum diisi di mode production.\n" +
            "       Frontend yang di-host terpisah TIDAK akan bisa mengakses API ini.\n" +
            "       Set CORS_ORIGIN ke origin frontend, contoh:\n" +
            "       CORS_ORIGIN=https://namaanda.github.io"
    );
}

const corsMiddleware = (req, res, next) => {
    const asal = req.headers.origin;

    // Tanpa header Origin (health check, curl, Postman) -> bukan permintaan
    // CORS. Loloskan apa adanya supaya health check Render tetap 200.
    if (!asal) return next();

    const cocok =
        DAFTAR_ASAL.includes("*") || DAFTAR_ASAL.includes(asal.replace(/\/$/, ""));

    if (cocok) {
        // Origin dibalas persis (bukan "*") lalu ditandai Vary supaya cache
        // tidak salah menyajikan header izin ke origin lain.
        res.setHeader("Access-Control-Allow-Origin", asal);
        res.vary("Origin");
        // PATCH wajib ada di daftar ini — endpoint pembatalan transaksi
        // memakainya. Tanpa PATCH, preflight akan gagal dan pembatalan
        // tidak pernah sampai ke server saat frontend di-host terpisah.
        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        );
        // Authorization wajib ada: frontend mengirim token JWT di header ini.
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Max-Age", "86400"); // cache preflight 24 jam
    }

    // Preflight: browser mengirim OPTIONS lebih dulu untuk POST JSON
    // maupun permintaan ber-header Authorization.
    if (req.method === "OPTIONS") {
        res.status(cocok ? 204 : 403).end();
        return;
    }

    // Origin tidak dikenal tetap dilanjutkan TANPA header izin.
    // Browser yang akan memblokir; server tidak perlu error 500.
    next();
};

module.exports = corsMiddleware;
module.exports.DAFTAR_ASAL = DAFTAR_ASAL;
