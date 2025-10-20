const express = require("express");
const router = express.Router();
const controller = require("../controllers/counterController");

router.get("/:name", controller.getValue);
router.post("/:name/increment", controller.increment);
router.post("/:name/reset", controller.reset);

module.exports = router;
