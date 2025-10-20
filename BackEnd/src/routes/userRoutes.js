const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middlewares/auth");
const authorizeAdmin = require("../middlewares/authorizeAdmin");

// Hanya admin yang boleh akses semua user endpoint
router.use(auth, authorizeAdmin);

router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.delete);

module.exports = router;
