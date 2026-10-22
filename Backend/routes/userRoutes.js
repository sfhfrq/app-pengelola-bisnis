const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Daftar pengguna hanya untuk admin — kasir tidak perlu melihat data user.
router.get("/", authMiddleware, roleMiddleware("admin"), userController.getAllUsers);

module.exports = router;
