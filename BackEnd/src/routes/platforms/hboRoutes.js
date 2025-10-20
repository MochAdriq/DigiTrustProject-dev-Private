const express = require("express");
const router = express.Router();
const controller = require("../../controllers/platforms/hboController");
const auth = require("../../middlewares/auth");
const authorizeAdmin = require("../../middlewares/authorizeAdmin");

// Authenticated routes
router.use(auth);

// Semua user bisa lihat
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// Hanya Admin yang bisa tambah, update, hapus
router.post("/", authorizeAdmin, controller.create);
router.put("/:id", authorizeAdmin, controller.update);
router.delete("/:id", authorizeAdmin, controller.delete);

module.exports = router;
