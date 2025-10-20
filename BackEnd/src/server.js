const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ================================
 * 🧩 MIDDLEWARES
 * ================================ */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Custom logger
const logger = require("./middlewares/activityLogger");
app.use(logger);

/* ================================
 * 🏠 ROOT ENDPOINT
 * ================================ */
app.get("/", (req, res) => {
  res.send("🚀 Backend server is up and running successfully!");
});

/* ================================
 * 🌐 ROUTES
 * ================================ */
const routes = require("./routes");
app.use("/api", routes);

/* ================================
 * ⚠️ 404 HANDLER
 * ================================ */
app.use((req, res) => {
  res.status(404).send("❌ Endpoint not found.");
});

/* ================================
 * 💥 ERROR HANDLER
 * ================================ */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).send("💥 Internal Server Error.");
});

/* ================================
 * 🚀 START SERVER
 * ================================ */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
