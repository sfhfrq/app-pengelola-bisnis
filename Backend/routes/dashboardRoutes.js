const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Ringkasan dashboard boleh dilihat admin maupun kasir.
router.get(
    "/ringkasan",
    authMiddleware,
    roleMiddleware("admin", "kasir"),
    dashboardController.getRingkasan
);

module.exports = router;
