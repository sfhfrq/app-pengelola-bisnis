const produkModel = require("../models/produkModel");
const ValidationError = require("../errors/ValidationError");

const getAllProduk = async (req, res, next) => {
    try {
        const cari = req.query.cari || null;
        const status = req.query.status || null;
        // Batas atas WAJIB — cegah unbounded query (celah DoS umum di API).
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        const [produk, total] = await Promise.all([
            produkModel.getAllProduk({ cari, status, limit, offset }),
            produkModel.countProduk({ cari, status })
        ]);

        res.status(200).json({
            data: produk,
            // `total` ditambahkan (aditif) — `jumlah` dipertahankan
            // supaya pemanggil lama tidak rusak.
            meta: { limit, offset, jumlah: produk.length, total }
        });
    } catch (error) {
        next(error);
    }
};

const getProdukById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new ValidationError("ID tidak valid");
        }

        const produk = await produkModel.getProdukById(id);
        if (!produk) {
            return res.status(404).json({ pesan: "Produk tidak ditemukan" });
        }

        res.status(200).json({ data: produk });
    } catch (error) {
        next(error);
    }
};

const validasiProduk = (body) => {
    // Guard `|| {}`: kalau req.body undefined, destructuring tidak throw.
    const { nama_produk, harga, stok } = body || {};

    const hargaNum = Number(harga);
    const stokNum = Number(stok);

    if (
        typeof nama_produk !== "string" ||
        nama_produk.trim() === "" ||
        !Number.isFinite(hargaNum) ||   // DECIMAL: boleh 3500.50
        hargaNum < 0 ||
        !Number.isInteger(stokNum) ||   // stok tetap bilangan bulat
        stokNum < 0
    ) {
        throw new ValidationError("Data produk tidak valid");
    }

    return {
        nama_produk: nama_produk.trim(),
        harga: hargaNum,
        stok: stokNum
    };
};

const createProduk = async (req, res, next) => {
    try {
        const data = validasiProduk(req.body);
        const result = await produkModel.createProduk(data);

        res.status(201).json({
            pesan: "Produk berhasil ditambahkan",
            id: result.insertId
        });
    } catch (error) {
        next(error);
    }
};

const updateProduk = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new ValidationError("ID tidak valid");
        }

        const data = validasiProduk(req.body);
        const result = await produkModel.updateProduk(id, data);

        if (result.affectedRows === 0) {
            // affectedRows 0 bisa berarti: produk tidak ada, ATAU data sama persis
            const produk = await produkModel.getProdukById(id);
            if (!produk) {
                return res.status(404).json({ pesan: "Produk tidak ditemukan" });
            }
            return res.status(200).json({
                pesan: "Data produk tidak mengalami perubahan"
            });
        }

        res.status(200).json({ pesan: "Produk berhasil diubah" });
    } catch (error) {
        next(error);
    }
};

const deleteProduk = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new ValidationError("ID tidak valid");
        }

        const result = await produkModel.deleteProduk(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ pesan: "Produk tidak ditemukan" });
        }

        res.status(200).json({ pesan: "Produk berhasil dihapus" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllProduk,
    getProdukById,
    createProduk,
    updateProduk,
    deleteProduk
};