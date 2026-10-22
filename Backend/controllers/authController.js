const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const ValidationError = require("../errors/ValidationError");

const login = async (req, res, next) => {
    try {
        // Guard `|| {}`: di Express 5, req.body bisa undefined kalau
        // Content-Type bukan application/json. Tanpa ini → TypeError → 500.
        const { nama, password } = req.body || {};

        if (!nama || !password) {
            throw new ValidationError("Nama dan password wajib diisi");
        }

        const user = await userModel.getUserByNama(nama);

        // Pesan 401 sengaja SAMA untuk "user tidak ada" dan "password salah"
        // — mencegah penyerang menebak nama user yang valid (enumeration).
        if (!user) {
            return res.status(401).json({ pesan: "Nama atau password salah" });
        }

        const passwordBenar = await bcrypt.compare(password, user.password);
        if (!passwordBenar) {
            return res.status(401).json({ pesan: "Nama atau password salah" });
        }

        const token = jwt.sign(
            { id: user.id, nama: user.nama, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            pesan: "Login berhasil",
            token,
            user: { id: user.id, nama: user.nama, role: user.role }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { login };