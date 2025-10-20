// controllers/authController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // 🟢 LOGIN
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validasi input
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username dan password wajib diisi" });
      }

      // Cek user di database
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      // Cek password langsung (tanpa hash)
      if (user.password !== password) {
        return res.status(401).json({ error: "Password salah" });
      }
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  },

  // 🔴 LOGOUT (dummy)
  async logout(req, res) {
    res.json({ message: "Logout berhasil (tanpa session)" });
  },
};
