const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const MODEL = "Counter";

module.exports = {
  // Ambil nilai counter berdasarkan nama
  async getValue(req, res) {
    const { name } = req.params;
    try {
      const counter = await prisma.counter.findUnique({ where: { name } });
      if (!counter) {
        return res
          .status(404)
          .json({ success: false, message: "Counter not found" });
      }
      res.json({ success: true, name, value: counter.value });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Tambah 1 nilai counter dan kembalikan hasilnya
  async increment(req, res) {
    const { name } = req.params;
    try {
      const counter = await prisma.counter.upsert({
        where: { name },
        update: { value: { increment: 1 } },
        create: { name, value: 1 },
      });

      res.json({ success: true, name, value: counter.value });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Reset counter ke 0
  async reset(req, res) {
    const { name } = req.params;
    try {
      const counter = await prisma.counter.update({
        where: { name },
        data: { value: 0 },
      });
      res.json({
        success: true,
        message: `Counter '${name}' reset`,
        value: counter.value,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
