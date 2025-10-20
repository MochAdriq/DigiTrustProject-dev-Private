// controllers/activityLogController.js
const { PrismaClient } = require("@prisma/client");
const { Parser } = require("json2csv");
const { generateCustomId } = require("../utils/idGenerator");

const prisma = new PrismaClient();
const MODEL = "ActivityLog";

module.exports = {
  /**
   * 🟢 CREATE LOG — dipakai otomatis oleh activityLogger.js
   */
  async create(req, res) {
    try {
      const { action, platform, target, type, status, details } = req.body;
      const user = req.user || {}; // bisa dari session atau sistem

      const id = generateCustomId(MODEL);
      const log = await prisma.activityLog.create({
        data: {
          id,
          action,
          platform: platform || "—",
          target: target || "—",
          type: type || "system",
          status: status || "success",
          details: details || "",
          userId: user.id || "SYSTEM",
        },
      });

      res.status(201).json({
        success: true,
        message: "Log berhasil dibuat",
        data: log,
      });
    } catch (error) {
      console.error("❌ Error create log:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membuat log",
      });
    }
  },

  /**
   * 🟡 GET ALL LOGS — untuk admin & operator (semua log)
   */
  async getAll(req, res) {
    try {
      const { search, type, status, platform, startDate, endDate } = req.query;

      const where = {
        ...(search
          ? {
              OR: [
                { action: { contains: search, mode: "insensitive" } },
                { platform: { contains: search, mode: "insensitive" } },
                { target: { contains: search, mode: "insensitive" } },
                { details: { contains: search, mode: "insensitive" } },
                {
                  user: { username: { contains: search, mode: "insensitive" } },
                },
              ],
            }
          : {}),
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(platform ? { platform } : {}),
        ...(startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      };

      const logs = await prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedLogs = logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt,
        user: log.user ? log.user.username : "System",
        action: log.action,
        platform: log.platform || "—",
        target: log.target || "—",
        type: log.type,
        status: log.status,
        details: log.details,
      }));

      res.json({
        success: true,
        message: "Daftar activity log berhasil diambil",
        data: formattedLogs,
      });
    } catch (error) {
      console.error("❌ Error getAll logs:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data log",
      });
    }
  },

  /**
   * 🟣 EXPORT LOGS TO CSV
   */
  async exportCSV(req, res) {
    try {
      const logs = await prisma.activityLog.findMany({
        include: {
          user: {
            select: { username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formatted = logs.map((log) => ({
        Timestamp: log.createdAt.toISOString(),
        User: log.user ? log.user.username : "System",
        Action: log.action,
        Platform: log.platform || "—",
        Target: log.target || "—",
        Type: log.type,
        Status: log.status,
        Details: log.details,
      }));

      const parser = new Parser();
      const csv = parser.parse(formatted);

      res.header("Content-Type", "text/csv");
      res.attachment("activity_logs.csv");
      return res.send(csv);
    } catch (error) {
      console.error("❌ Error export CSV:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengekspor data ke CSV",
      });
    }
  },
};
