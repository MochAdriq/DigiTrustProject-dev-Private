const express = require("express");
const router = express.Router();
const controller = require("../../controllers/platforms/warrantyVidioPlatinumController");
const auth = require("../../middlewares/auth");
const authorizeAdmin = require("../../middlewares/authorizeAdmin");

// Semua endpoint garansi wajib login
router.use(auth);

// 🔹 Lihat semua garansi (Admin + Operator)
router.get("/", controller.getAll);

// 🔹 Filter berdasarkan tanggal input (Admin + Operator)
router.get("/search", controller.searchByCreatedDate);

// 🔹 Tambah akun garansi baru (Admin only)
router.post("/", authorizeAdmin, controller.create);

// 🔹 Hapus akun garansi (Admin only)
router.delete("/:id", authorizeAdmin, controller.delete);

module.exports = router;
