// routes/activityLogRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/activityLogController");

// 🔐 Semua route hanya untuk user yang sudah login (admin & operator)
router.use(auth);

// 🟡 GET ALL LOGS
router.get("/", controller.getAll);

// 🟣 EXPORT CSV
router.get("/export", controller.exportCSV);

// 🟢 CREATE LOG (biasanya dipakai internal lewat activityLogger.js)
router.post("/", controller.create);

module.exports = router;
