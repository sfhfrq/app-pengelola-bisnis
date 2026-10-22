require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Graceful shutdown — tutup koneksi dengan rapi saat Ctrl+C.
const matikan = (sinyal) => {
    console.log(`\n${sinyal} diterima, menutup server...`);
    server.close(() => {
        console.log("Server ditutup dengan rapi.");
        process.exit(0);
    });
};

process.on("SIGINT", () => matikan("SIGINT"));
process.on("SIGTERM", () => matikan("SIGTERM"));