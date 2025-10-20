const { PrismaClient } = require("@prisma/client");
const { generateCustomId } = require("../../utils/idGenerator");
const { recordActivity } = require("../../utils/activityLogger");
const prisma = new PrismaClient();

const MODEL = "WarrantyYoutube1Bulan";

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

// Fungsi menghitung status slot, contoh: "19/20"
function getProfileStatus(profileList = []) {
  const total = profileList.length;
  const used = profileList.filter((p) => p.used).length;
  return `${total - used}/${total}`;
}

// Fungsi menentukan apakah semua profil sudah terpakai
function calculateAccountStatus(profileList = []) {
  if (!profileList.length) return "AVAILABLE";
  const allUsed = profileList.every((p) => p.used);
  return allUsed ? "UNAVAILABLE" : "AVAILABLE";
}

module.exports = {
  // 🔹 GET ALL WARRANTY ACCOUNTS
  async getAll(req, res) {
    try {
      const data = await prisma.warrantyCanva1Bulan.findMany({
        orderBy: { createdAt: "desc" },
      });

      // Tambahkan informasi profilStatus + update status otomatis jika penuh
      const formatted = await Promise.all(
        data.map(async (item) => {
          const currentStatus = calculateAccountStatus(item.profile || []);
          if (currentStatus !== item.status) {
            // Auto update status di DB
            await prisma.warrantyCanva1Bulan.update({
              where: { id: item.id },
              data: { status: currentStatus },
            });
          }

          return {
            ...item,
            profileStatus: getProfileStatus(item.profile),
            status: currentStatus,
          };
        })
      );

      res.json({ success: true, total: formatted.length, data: formatted });
    } catch (err) {
      console.error(`❌ Error fetching ${MODEL}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🔹 SEARCH WARRANTY BY CREATED DATE
  async searchByCreatedDate(req, res) {
    try {
      const { date } = req.query;
      if (!date)
        return res.status(400).json({
          success: false,
          message: "Please provide a date (e.g. ?date=2025-10-20)",
        });

      const selectedDate = new Date(date);
      const data = await prisma.warrantyCanva1Bulan.findMany({
        where: {
          createdAt: { gte: selectedDate },
        },
        orderBy: { createdAt: "asc" },
      });

      const formatted = data.map((item) => ({
        ...item,
        profileStatus: getProfileStatus(item.profile),
        status: calculateAccountStatus(item.profile),
      }));

      res.json({
        success: true,
        message: `Found ${formatted.length} warranties created after ${date}`,
        data: formatted,
      });
    } catch (err) {
      console.error(`❌ Error searching ${MODEL}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🔹 CREATE WARRANTY (Manual by Admin)
  async create(req, res) {
    try {
      const { email, password, type, expiresAt } = req.body;

      const data = await prisma.$transaction(async (tx) => {
        const id = await generateCustomId(MODEL, tx);
        const profiles = generateProfiles(type);
        const status = calculateAccountStatus(profiles);

        const created = await tx.warrantyCanva1Bulan.create({
          data: {
            id,
            email,
            password,
            type,
            profile: profiles,
            status,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });

        // 🟢 Catat aktivitas
        await recordActivity({
          tx,
          userId: req.user?.id,
          action: "CREATE_WARRANTY",
          model: MODEL,
          entity: email,
          entityId: id,
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

  // 🔹 DELETE WARRANTY
  async delete(req, res) {
    try {
      const deleted = await prisma.warrantyCanva1Bulan.delete({
        where: { id: req.params.id },
      });

      await recordActivity({
        userId: req.user?.id,
        action: "DELETE_WARRANTY",
        model: MODEL,
        entity: deleted.email,
        entityId: deleted.id,
      });

      res.json({ success: true, message: "Warranty deleted successfully" });
    } catch (err) {
      console.error(`❌ Error deleting ${MODEL}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
