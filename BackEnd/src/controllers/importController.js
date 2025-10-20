// src/controllers/importController.js
const { PrismaClient } = require("@prisma/client");
const { recordActivity } = require("../utils/activityLogger");
const { generateCustomId } = require("../utils/idGenerator");

const prisma = new PrismaClient();

/**
 * 🧩 Controller: Import Accounts (Mass Import)
 * Digunakan oleh ADMIN untuk memasukkan banyak akun sekaligus ke platform tertentu.
 * Tiap akun akan dibuat ID unik dan disimpan sebagai record terpisah.
 */
module.exports = {
  async importAccounts(req, res) {
    const { platform, accounts, password, type, expiresAt } = req.body;

    // 🧠 Validasi dasar
    if (!platform || !accounts?.length || !password || !type) {
      return res.status(400).json({
        success: false,
        message: "Platform, accounts, password, and type are required fields.",
      });
    }

    try {
      // Pastikan model Prisma tersedia
      const model = prisma[platform];
      if (!model)
        return res
          .status(400)
          .json({
            success: false,
            message: `Invalid platform name: ${platform}`,
          });

      // Simpan akun menggunakan transaksi agar atomic
      const createdAccounts = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const acc of accounts) {
          // Buat ID unik tiap akun
          const id = await generateCustomId(platform.toUpperCase(), tx);

          // Buat akun baru
          const created = await tx[platform].create({
            data: {
              id,
              email: acc.email,
              password,
              type,
              expiresAt: expiresAt ? new Date(expiresAt) : null,
              status: "AVAILABLE",
              startAt: new Date(),
            },
          });

          results.push(created);
        }

        // Catat aktivitas sistem
        await recordActivity({
          tx,
          userId: req.user?.id,
          action: "IMPORT",
          model: platform.toUpperCase(),
          description: `Imported ${accounts.length} ${type} accounts`,
        });

        return results;
      });

      res.status(201).json({
        success: true,
        total: createdAccounts.length,
        message: `${createdAccounts.length} ${platform} accounts imported successfully.`,
        data: createdAccounts,
      });
    } catch (err) {
      console.error(`❌ Error importing ${platform}:`, err);
      res.status(500).json({
        success: false,
        message: "Failed to import accounts.",
        error: err.message,
      });
    }
  },
};
