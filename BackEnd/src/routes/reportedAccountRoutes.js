// routes/reportedAccountRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorizeAdmin = require("../middlewares/authorizeAdmin");
const controller = require("../controllers/reportedAccountController");

// 🔐 Semua user harus login
router.use(auth);

// 🟢 Tambah laporan (Operator)
router.post("/", controller.create);

// 🟡 Ambil semua laporan (Admin & Operator)
router.get("/", controller.getAll);

// 🔵 Ubah status laporan (Admin only)
router.put("/:id/status", authorizeAdmin, controller.updateStatus);

// 🔴 Hapus laporan (Admin only)
router.delete("/:id", authorizeAdmin, controller.remove);

module.exports = router;
