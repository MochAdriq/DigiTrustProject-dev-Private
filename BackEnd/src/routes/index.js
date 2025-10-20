const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const counterRoutes = require("./counterRoutes");
/* ===========================================
 * 🌐 CORE ROUTES
 * =========================================== */
router.use(auth);
router.use("/auth", require("./authRoutes"));
router.use("/request-account", require("./requestAccountRoutes"));
router.use("/import", require("./importRoutes"));
router.use("/users", require("./userRoutes"));
router.use("/activity-logs", require("./activityLogRoutes"));
router.use("/counters", require("./counterRoutes"));
router.use("/customer-assignments", require("./customerAssignmentRoutes"));
router.use("/reported-accounts", require("./reportedAccountRoutes"));

/* ===========================================
 * 🎬 PLATFORM ROUTES
 * =========================================== */
router.use("/platforms/netflix", require("./platforms/netflixRoutes"));
router.use("/platforms/disney", require("./platforms/disneyRoutes"));
router.use("/platforms/primevideo", require("./platforms/primeVideoRoutes"));
router.use("/platforms/hbo", require("./platforms/hboRoutes"));
router.use("/platforms/viu-1-bulan", require("./platforms/viu1BulanRoutes"));
router.use(
  "/platforms/vidio-diamond-mobile",
  require("./platforms/vidioDiamondMobileRoutes")
);
router.use(
  "/platforms/vidio-platinum",
  require("./platforms/vidioPlatinumRoutes")
);
router.use("/platforms/wetv", require("./platforms/weTvRoutes"));
router.use("/platforms/loklok", require("./platforms/loklokRoutes"));
router.use("/platforms/capcut", require("./platforms/capcutRoutes"));
router.use("/platforms/chatgpt", require("./platforms/chatGptRoutes"));
router.use(
  "/platforms/youtube-1-bulan",
  require("./platforms/youtube1BulanRoutes")
);
router.use(
  "/platforms/canva-1-bulan",
  require("./platforms/canva1BulanRoutes")
);
router.use(
  "/platforms/canva-1-tahun",
  require("./platforms/canva1TahunRoutes")
);
router.use(
  "/platforms/spotify-famplan-1-bulan",
  require("./platforms/spotifyFamplan1BulanRoutes")
);
router.use(
  "/platforms/spotify-famplan-2-bulan",
  require("./platforms/spotifyFamplan2BulanRoutes")
);

/* ===========================================
 * 🧾 WARRANTY ROUTES
 * =========================================== */
router.use(
  "/warranty/canva-1-bulan",
  require("./platforms/warrantyCanva1BulanRoutes")
);
router.use(
  "/warranty/canva-1-tahun",
  require("./platforms/warrantyCanva1TahunRoutes")
);
router.use("/warranty/capcut", require("./platforms/warrantyCapcutRoutes"));
router.use("/warranty/chatgpt", require("./platforms/warrantyChatGptRoutes"));
router.use("/warranty/disney", require("./platforms/warrantyDisneyRoutes"));
router.use("/warranty/hbo", require("./platforms/warrantyHboRoutes"));
router.use("/warranty/loklok", require("./platforms/warrantyLoklokRoutes"));
router.use("/warranty/netflix", require("./platforms/warrantyNetflixRoutes"));
router.use(
  "/warranty/primevideo",
  require("./platforms/warrantyPrimeVideoRoutes")
);
router.use(
  "/warranty/spotify-famplan-1-bulan",
  require("./platforms/warrantySpotifyFamplan1BulanRoutes")
);
router.use(
  "/warranty/spotify-famplan-2-bulan",
  require("./platforms/warrantySpotifyFamplan2BulanRoutes")
);
router.use(
  "/warranty/vidio-diamond-mobile",
  require("./platforms/warrantyVidioDiamondMobileRoutes")
);
router.use(
  "/warranty/vidio-platinum",
  require("./platforms/warrantyVidioPlatinumRoutes")
);
router.use(
  "/warranty/viu-1-bulan",
  require("./platforms/warrantyViu1BulanRoutes")
);
router.use("/warranty/wetv", require("./platforms/warrantyWeTvRoutes"));
router.use(
  "/warranty/youtube-1-bulan",
  require("./platforms/warrantyYoutube1BulanRoutes")
);

/* ===========================================
 * ✅ DEFAULT ENDPOINT
 * =========================================== */
router.get("/", (req, res) => {
  res.json({ message: "🚀 API running successfully" });
});

module.exports = router;
