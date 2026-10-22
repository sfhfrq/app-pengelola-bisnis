const userModel = require("../models/userModel");

// GET /api/users — daftar pengguna (khusus admin).
const getAllUsers = async (req, res, next) => {
    try {
        const pengguna = await userModel.getAllUsers();
        res.status(200).json({
            data: pengguna,
            meta: { jumlah: pengguna.length }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllUsers };
