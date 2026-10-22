const dashboardModel = require("../models/dashboardModel");
const ValidationError = require("../errors/ValidationError");

/**
 * GET /api/dashboard/ringkasan?tahun=2026
 *
 * Satu endpoint untuk seluruh isi dashboard. Frontend hanya perlu
 * satu request saat halaman dibuka -> tidak ada waterfall.
 */
const getRingkasan = async (req, res, next) => {
    try {
        const tahunSekarang = new Date().getFullYear();
        const tahun = req.query.tahun ? Number(req.query.tahun) : tahunSekarang;

        if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
            throw new ValidationError("Parameter tahun tidak valid");
        }

        // Semua query dijalankan paralel — saling tidak bergantung.
        const [statistik, grafik, menungguPembayaran, pendapatanTahun] =
            await Promise.all([
                dashboardModel.getStatistik(),
                dashboardModel.getGrafikTahunan(tahun),
                dashboardModel.getMenungguPembayaran(5),
                dashboardModel.getTotalPendapatanTahun(tahun)
            ]);

        res.status(200).json({
            data: {
                statistik,
                grafik: { ...grafik, total_pendapatan: pendapatanTahun },
                menunggu_pembayaran: menungguPembayaran,
                dibuat_pada: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getRingkasan };
