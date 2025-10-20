// utils/activityLogger.js
const { PrismaClient } = require("@prisma/client");
const { generateCustomId } = require("./idGenerator");
const prisma = new PrismaClient();

const MODEL = "ActivityLog";

/**
 * 🧾 Fungsi utama untuk mencatat aktivitas ke database
 * @param {Object} options
 * @param {String} options.userId - ID user yang melakukan aksi (optional)
 * @param {String} options.userName - Username user
 * @param {String} options.action - Jenis aksi (CREATE_USER, DELETE_ACCOUNT, dll)
 * @param {String} options.platform - Platform terkait (Netflix, Disney, dll)
 * @param {String} options.target - Target objek/akun dari aksi
 * @param {String} options.type - Jenis log (user, account, request, system, dll)
 * @param {String} options.status - Status hasil (success, error, warning)
 * @param {String} options.details - Deskripsi tambahan
 */
async function log({
  userId = null,
  userName = "System",
  action,
  platform = "—",
  target = "—",
  type = "system",
  status = "success",
  details = "",
}) {
  try {
    const id = generateCustomId(MODEL);
    await prisma.activityLog.create({
      data: {
        id,
        userId,
        action,
        platform,
        target,
        type,
        status,
        details,
      },
    });

    console.log(
      `[ActivityLog] ${new Date().toISOString()} | ${userName} | ${action} | ${platform} | ${status}`
    );
  } catch (error) {
    console.error("❌ Gagal mencatat log aktivitas:", error);
  }
}

/**
 * 🔍 Middleware ringan untuk mencatat request HTTP (opsional)
 * Bisa kamu pasang global di Express jika mau log semua request.
 */
function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = {
  log,
  requestLogger,
};
