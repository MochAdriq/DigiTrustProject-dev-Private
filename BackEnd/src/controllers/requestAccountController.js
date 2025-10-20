const { PrismaClient } = require("@prisma/client");
const { generateCustomId } = require("../utils/idGenerator");
const { recordActivity } = require("../utils/activityLogger");
const prisma = new PrismaClient();
const MODEL = "RequestAccount";

module.exports = {
  // 🔹 REQUEST ACCOUNT
  async requestAccount(req, res) {
    const { platformName, accountType, customerName, expiresAt } = req.body;
    const user = req.user;

    try {
      const data = await prisma.$transaction(async (tx) => {
        // Tentukan model platform berdasarkan nama
        const platformModel = platformName.replace(/[-\s]/g, "").toLowerCase();

        if (!tx[platformModel]) {
          throw new Error(`Invalid platform name: ${platformName}`);
        }

        // 🔍 Cari akun tersedia
        const availableAccount = await tx[platformModel].findFirst({
          where: { type: accountType.toUpperCase(), status: "AVAILABLE" },
        });

        if (!availableAccount) {
          throw new Error(
            `No ${platformName} account available for type ${accountType}`
          );
        }

        // Ambil data profil & hitung sisa slot
        const profiles = availableAccount.profile || [];
        const availableProfiles = profiles.filter((p) => !p.used);

        if (availableProfiles.length === 0) {
          // Jika semua terpakai
          await tx[platformModel].update({
            where: { id: availableAccount.id },
            data: { status: "UNAVAILABLE" },
          });
          throw new Error(`All ${platformName} profiles are in use`);
        }

        // Pilih profil pertama yang kosong
        const selectedProfile = availableProfiles[0];
        selectedProfile.used = true;

        const remaining = availableProfiles.length - 1;
        const newStatus = remaining === 0 ? "UNAVAILABLE" : "AVAILABLE";

        // 🔄 Update profil dan status
        await tx[platformModel].update({
          where: { id: availableAccount.id },
          data: {
            profile: profiles,
            status: newStatus,
          },
        });

        // 🧾 Buat Customer Assignment baru
        const assignmentId = await generateCustomId("CustomerAssignment", tx);
        const assignment = await tx.customerAssignment.create({
          data: {
            id: assignmentId,
            platformName,
            accountId: availableAccount.id,
            customerName,
            operatorId: user.id,
            note: `Assigned ${selectedProfile.name}`,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });

        // 🟢 Catat aktivitas
        await recordActivity({
          tx,
          userId: user.id,
          action: "REQUEST_ACCOUNT",
          model: platformModel,
          entity: availableAccount.email,
          entityId: availableAccount.id,
        });

        return {
          platformName,
          email: availableAccount.email,
          password: availableAccount.password,
          profile: selectedProfile.name,
          type: availableAccount.type,
          customer: customerName,
          operator: user.username,
          expiresAt: assignment.expiresAt,
        };
      });

      res.status(201).json({
        success: true,
        message: "Account assigned successfully",
        data,
      });
    } catch (err) {
      console.error("❌ Error in requestAccount:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
};
