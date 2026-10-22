const express = require("express");
const router = express.Router();

const transaksiController = require("../controllers/transaksiController");
const detailTransaksiController = require("../controllers/detailTransaksiController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// POST /api/transaksi — buat transaksi baru
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin", "kasir"),
    transaksiController.createTransaksi
);

// GET /api/transaksi — daftar transaksi (paginasi + filter status)
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin", "kasir"),
    transaksiController.getAllTransaksi
);

// PATCH /api/transaksi/:id/batal — batalkan transaksi + kembalikan stok.
// Kasir diizinkan membatalkan karena orang yang salah input adalah kasirnya
// sendiri. Kalau Anda ingin membatasi ini hanya untuk admin, ganti
// roleMiddleware("admin", "kasir") menjadi roleMiddleware("admin").
router.patch(
    "/:id/batal",
    authMiddleware,
    roleMiddleware("admin", "kasir"),
    transaksiController.batalkanTransaksi
);

// GET /api/transaksi/:id — detail transaksi (header + items)
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("admin", "kasir"),
    detailTransaksiController.getDetailTransaksi
);

module.exports = router;