require("dotenv").config();

const express = require("express");
const app = express();

const authRoutes = require("./routes/authRoutes");
const produkRoutes = require("./routes/produkRoutes");
const transaksiRoutes = require("./routes/transaksiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const corsMiddleware = require("./middleware/corsMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

// Di belakang proxy (Render, Railway, dll) server menerima koneksi dari
// proxy, bukan dari pengunjung langsung. Tanpa ini, req.ip dan req.secure
// akan salah. Angka 1 = percayai satu lapis proxy terdekat.
app.set("trust proxy", 1);

// WAJIB PALING AWAL: preflight (OPTIONS) tidak punya body, jadi harus
// dijawab sebelum express.json(). Juga membuka akses bagi frontend yang
// di-host di origin berbeda (mis. GitHub Pages).
app.use(corsMiddleware);

// Batasi ukuran body — cegah DoS lewat JSON raksasa.
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/produk", produkRoutes);
app.use("/api/transaksi", transaksiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ pesan: "App Pengelola Bisnis berjalan" });
});

// 404 — setelah semua route, sebelum error handler.
app.use((req, res) => {
    res.status(404).json({
        pesan: `Endpoint ${req.method} ${req.path} tidak ditemukan`
    });
});

// Global error handler — paling akhir.
app.use(errorMiddleware);

module.exports = app;