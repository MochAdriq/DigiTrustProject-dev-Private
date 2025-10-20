// controllers/reportedAccountController.js
const { PrismaClient } = require("@prisma/client");
const { generateCustomId } = require("../utils/idGenerator");
const { log: activityLog } = require("../utils/activityLogger");

const prisma = new PrismaClient();
const MODEL = "ReportedAccount";

module.exports = {
  /**
   * 🟢 CREATE REPORT (Operator)
   * Membuat laporan akun bermasalah
   */
  async create(req, res) {
    try {
      const { platformName, accountEmail, accountId, reason } = req.body;

      if (!platformName || !accountEmail || !reason) {
        return res.status(400).json({
          success: false,
          message: "platformName, accountEmail, dan reason wajib diisi.",
        });
      }

      const id = generateCustomId(MODEL);
      const report = await prisma.reportedAccount.create({
        data: {
          id,
          platformName,
          accountId: accountId || null,
          accountEmail,
          reportedById: req.user.id,
          reason,
          status: "PENDING",
        },
        include: {
          reportedBy: {
            select: { username: true, fullName: true },
          },
        },
      });

      // 🧾 Catat ke activity log
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "REPORT_ACCOUNT",
        platform: platformName,
        target: accountEmail,
        type: "account",
        status: "warning",
        details: reason,
      });

      res.status(201).json({
        success: true,
        message: "Laporan akun berhasil dibuat.",
        data: report,
      });
    } catch (error) {
      console.error("❌ Error create report:", error);

      await activityLog({
        userId: req.user?.id,
        userName: req.user?.username,
        action: "REPORT_ACCOUNT",
        type: "account",
        status: "error",
        details: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Gagal membuat laporan akun.",
      });
    }
  },

  /**
   * 🟡 GET ALL REPORTS
   * Menampilkan semua akun yang dilaporkan (Admin & Operator)
   */
  async getAll(req, res) {
    try {
      const { search, platform, status } = req.query;

      const where = {
        ...(platform
          ? { platformName: { contains: platform, mode: "insensitive" } }
          : {}),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { platformName: { contains: search, mode: "insensitive" } },
                { accountEmail: { contains: search, mode: "insensitive" } },
                { reason: { contains: search, mode: "insensitive" } },
                {
                  reportedBy: {
                    username: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      };

      const reports = await prisma.reportedAccount.findMany({
        where,
        include: {
          reportedBy: {
            select: {
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formatted = reports.map((r) => ({
        id: r.id,
        platform: r.platformName,
        email: r.accountEmail,
        reason: r.reason,
        status: r.status,
        reportedBy: r.reportedBy ? r.reportedBy.username : "Unknown",
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      }));

      res.json({
        success: true,
        message: "Daftar laporan akun berhasil diambil.",
        data: formatted,
      });
    } catch (error) {
      console.error("❌ Error getAll reports:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar laporan akun.",
      });
    }
  },

  /**
   * 🔵 UPDATE STATUS (Admin)
   * Mengubah status laporan: PENDING → IN_PROGRESS / RESOLVED / REJECTED
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status tidak valid. Gunakan salah satu dari: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      const report = await prisma.reportedAccount.findUnique({ where: { id } });
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Laporan tidak ditemukan.",
        });
      }

      const updated = await prisma.reportedAccount.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === "RESOLVED" ? new Date() : null,
        },
      });

      // 🧾 Catat ke log aktivitas
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "UPDATE_REPORT_STATUS",
        platform: report.platformName,
        target: report.accountEmail,
        type: "account",
        status: "success",
        details: `Mengubah status laporan menjadi ${status}`,
      });

      res.json({
        success: true,
        message: "Status laporan berhasil diperbarui.",
        data: updated,
      });
    } catch (error) {
      console.error("❌ Error update report status:", error);
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "UPDATE_REPORT_STATUS",
        type: "account",
        status: "error",
        details: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Gagal memperbarui status laporan.",
      });
    }
  },

  /**
   * 🔴 DELETE REPORT (Admin - opsional)
   */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const report = await prisma.reportedAccount.findUnique({ where: { id } });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Laporan tidak ditemukan.",
        });
      }

      await prisma.reportedAccount.delete({ where: { id } });

      // 🧾 Log aktivitas
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "DELETE_REPORT",
        platform: report.platformName,
        target: report.accountEmail,
        type: "account",
        status: "success",
        details: `Menghapus laporan akun ${report.accountEmail}`,
      });

      res.json({
        success: true,
        message: "Laporan berhasil dihapus.",
      });
    } catch (error) {
      console.error("❌ Error delete report:", error);
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "DELETE_REPORT",
        type: "account",
        status: "error",
        details: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Gagal menghapus laporan.",
      });
    }
  },
};
