const { PrismaClient } = require("@prisma/client");
const { generateCustomId } = require("../../utils/idGenerator");
const { recordActivity } = require("../../utils/activityLogger");

const prisma = new PrismaClient();
const MODEL = "PrimeVideo";

// Jumlah profil per tipe akun
const PROFILE_MAP = {
  SHARING: 20,
  PRIVATE: 8,
  VIP: 6,
};

// Fungsi generator profil otomatis
function generateProfiles(accountType) {
  const count = PROFILE_MAP[accountType?.toUpperCase()] || 0;
  return Array.from({ length: count }).map((_, i) => ({
    name: `Profile-${i + 1}`,
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    used: false,
  }));
}

// Hitung slot tersedia
function calculateAvailable(profileJson) {
  if (!profileJson) return { available: 0, total: 0 };
  const total = profileJson.length;
  const available = profileJson.filter((p) => !p.used).length;
  return { available, total };
}

// Hitung sisa hari aktif
function calculateDaysLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = Math.ceil(
    (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
}

module.exports = {
  // 🔹 Ambil semua akun Canva 1 Bulan
  async getAll(req, res) {
    try {
      const data = await prisma.canva1Bulan.findMany({
        orderBy: { createdAt: "desc" },
      });

      // Tambahkan info available/total dan daysLeft
      const formatted = data.map((acc) => {
        const { available, total } = calculateAvailable(acc.profile);
        const daysLeft = calculateDaysLeft(acc.expiresAt);
        return {
          ...acc,
          profileStatus: `${available}/${total}`,
          daysLeft,
        };
      });

      res.json({
        success: true,
        total: formatted.length,
        data: formatted,
      });
    } catch (err) {
      console.error(`❌ Error fetching ${MODEL}:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 🔹 Ambil akun berdasarkan ID
  async getById(req, res) {
    try {
      const data = await prisma.canva1Bulan.findUnique({
        where: { id: req.params.id },
      });
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Data not found" });

      const { available, total } = calculateAvailable(data.profile);
      const daysLeft = calculateDaysLeft(data.expiresAt);

      res.json({
        success: true,
        data: {
          ...data,
          profileStatus: `${available}/${total}`,
          daysLeft,
        },
      });
    } catch (err) {
      console.error(`❌ Error fetching ${MODEL} by ID:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 🔹 Tambah akun manual
  async create(req, res) {
    try {
      const { email, password, type, expiresAt } = req.body;
      if (!email || !password || !type)
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });

      const data = await prisma.$transaction(async (tx) => {
        const id = await generateCustomId(MODEL, tx);
        const profiles = generateProfiles(type);

        const created = await tx.canva1Bulan.create({
          data: {
            id,
            email,
            password,
            type,
            profile: profiles,
            status: "AVAILABLE",
            startAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });

        // Log aktivitas
        await recordActivity({
          tx,
          userId: req.user?.id,
          action: "CREATE",
          model: MODEL,
          description: `Added 1 ${type} account manually`,
        });

        return created;
      });

      res.status(201).json({
        success: true,
        message: `${MODEL} created successfully`,
        data,
      });
    } catch (err) {
      console.error(`❌ Error creating ${MODEL}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🔹 Update akun (misal ubah status, password, dsb)
  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await prisma.canva1Bulan.update({
        where: { id },
        data: req.body,
      });

      await recordActivity({
        userId: req.user?.id,
        action: "UPDATE",
        model: MODEL,
        description: `Updated account ${id}`,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      console.error(`❌ Error updating ${MODEL}:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 🔹 Hapus akun
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.canva1Bulan.delete({ where: { id } });

      await recordActivity({
        userId: req.user?.id,
        action: "DELETE",
        model: MODEL,
        description: `Deleted account ${id}`,
      });

      res.json({ success: true, message: `${MODEL} deleted successfully` });
    } catch (err) {
      console.error(`❌ Error deleting ${MODEL}:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
