const transaksiModel = require("../models/transaksiModel");
const detailTransaksiModel = require("../models/detailTransaksiModel");
const ValidationError = require("../errors/ValidationError");

const getDetailTransaksi = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new ValidationError("ID tidak valid");
        }

        // Dua query paralel — tidak saling bergantung.
        // Waktu total = max(T1, T2) bukan T1 + T2.
        const [header, items] = await Promise.all([
            transaksiModel.getTransaksiHeaderById(id),
            detailTransaksiModel.getItemsByTransaksiId(id)
        ]);

        if (!header) {
            return res.status(404).json({ pesan: "Transaksi tidak ditemukan" });
        }

        return res.status(200).json({
            data: { ...header, items }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDetailTransaksi };