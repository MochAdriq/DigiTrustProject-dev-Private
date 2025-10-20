// src/routes/importRoutes.js
const express = require("express");
const router = express.Router();
const { importAccounts } = require("../controllers/importController");
const auth = require("../middlewares/auth");
const authorizeAdmin = require("../middlewares/authorizeAdmin");

// 🛡️ Hanya Admin yang boleh melakukan import massal akun
router.post("/", auth, authorizeAdmin, importAccounts);

module.exports = router;
