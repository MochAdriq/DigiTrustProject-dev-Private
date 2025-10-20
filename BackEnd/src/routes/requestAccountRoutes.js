const express = require("express");
const router = express.Router();
const controller = require("../controllers/requestAccountController");
const auth = require("../middlewares/auth");

router.use(auth);

// 🔹 Operator dan Admin bisa request akun
router.post("/", controller.requestAccount);

module.exports = router;
