// controllers/userController.js
const { PrismaClient } = require("@prisma/client");
const { generateCustomId } = require("../utils/idGenerator");
const { log: activityLog } = require("../utils/activityLogger");

const prisma = new PrismaClient();
const MODEL = "User";

module.exports = {
  // 🟢 CREATE USER
  async create(req, res) {
    try {
      const { username, fullName, password, role } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username sudah digunakan.",
        });
      }

      const id = generateCustomId(MODEL);
      const newUser = await prisma.user.create({
        data: { id, username, fullName, password, role },
      });

      // 🧾 Catat log aktivitas
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "CREATE_USER",
        type: "user",
        status: "success",
        details: `Menambahkan user baru (${username}) dengan role ${role}`,
      });

      res.status(201).json({
        success: true,
        message: "User berhasil ditambahkan.",
        data: newUser,
      });
    } catch (error) {
      console.error("❌ Error create user:", error);
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "CREATE_USER",
        type: "user",
        status: "error",
        details: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membuat user.",
      });
    }
  },

  // 🟡 GET ALL USERS
  async getAll(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        message: "Daftar user berhasil diambil.",
        data: users,
      });
    } catch (error) {
      console.error("❌ Error getAll users:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar user.",
      });
    }
  },

  // 🔵 GET USER BY ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan.",
        });
      }

      // 🧾 Catat log aktivitas
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "VIEW_USER_DETAIL",
        type: "user",
        status: "success",
        details: `Melihat detail user (${user.username})`,
      });

      res.json({
        success: true,
        message: "Detail user berhasil diambil.",
        data: user,
      });
    } catch (error) {
      console.error("❌ Error getById user:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil detail user.",
      });
    }
  },

  // 🟠 UPDATE USER
  async update(req, res) {
    try {
      const { id } = req.params;
      const { username, fullName, password, role } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan.",
        });
      }

      if (user.role === "ADMIN" && role && role !== "ADMIN") {
        return res.status(400).json({
          success: false,
          message: "Role admin tidak dapat diubah.",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { username, fullName, password, role },
      });

      // 🧾 Catat log aktivitas
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "UPDATE_USER",
        type: "user",
        status: "success",
        details: `Memperbarui user (${username || user.username})`,
      });

      res.json({
        success: true,
        message: "User berhasil diperbarui.",
        data: updatedUser,
      });
    } catch (error) {
      console.error("❌ Error update user:", error);
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "UPDATE_USER",
        type: "user",
        status: "error",
        details: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memperbarui user.",
      });
    }
  },

  // 🔴 DELETE USER
  async remove(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan.",
        });
      }

      if (user.role === "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "User dengan role admin tidak dapat dihapus.",
        });
      }

      await prisma.user.delete({ where: { id } });

      // 🧾 Catat log aktivitas
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "DELETE_USER",
        type: "user",
        status: "success",
        details: `Menghapus user (${user.username})`,
      });

      res.json({
        success: true,
        message: "User berhasil dihapus.",
      });
    } catch (error) {
      console.error("❌ Error delete user:", error);
      await activityLog({
        userId: req.user.id,
        userName: req.user.username,
        action: "DELETE_USER",
        type: "user",
        status: "error",
        details: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menghapus user.",
      });
    }
  },
};
  