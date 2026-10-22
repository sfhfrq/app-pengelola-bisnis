const express = require("express");
const router = express.Router();
const produkController = require("../controllers/produkController");
const authMiddleware = require("../middleware/authMiddleware")
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/",authMiddleware,roleMiddleware("admin", "kasir"),produkController.getAllProduk);
router.get("/:id",authMiddleware,roleMiddleware("admin", "kasir"),produkController.getProdukById);
router.post("/",authMiddleware,roleMiddleware("admin"),produkController.createProduk);
router.put("/:id",authMiddleware,roleMiddleware("admin"),produkController.updateProduk);
router.delete("/:id",authMiddleware,roleMiddleware("admin"),produkController.deleteProduk);

module.exports = router;