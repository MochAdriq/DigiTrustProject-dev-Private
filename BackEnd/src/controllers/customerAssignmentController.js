const { PrismaClient } = require("@prisma/client");
const { generateCustomId } = require("../utils/idGenerator");
const { recordActivity } = require("../utils/activityLogger");
const prisma = new PrismaClient();
const MODEL = "CustomerAssignment";

module.exports = {
  // 🔹 GET ALL ASSIGNMENTS
  async getAll(req, res) {
    try {
      const data = await prisma.customerAssignment.findMany({
        include: {
          operator: { select: { id: true, username: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        total: data.length,
        data,
      });
    } catch (err) {
      console.error(`❌ Error fetching ${MODEL}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🔹 GET BY ID
  async getById(req, res) {
    try {
      const data = await prisma.customerAssignment.findUnique({
        where: { id: req.params.id },
        include: {
          operator: { select: { id: true, username: true, role: true } },
        },
      });

      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Data not found" });

      res.json({ success: true, data });
    } catch (err) {
      console.error(`❌ Error fetching ${MODEL} by ID:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🔹 CREATE ASSIGNMENT (Manual Admin)
  async create(req, res) {
    try {
      const data = await prisma.$transaction(async (tx) => {
        const id = await generateCustomId(MODEL, tx);

        const created = await tx.customerAssignment.create({
          data: {
            id,
            platformName: req.body.platformName,
            accountId: req.body.accountId,
            customerName: req.body.customerName,
            operatorId: req.body.operatorId,
            note: req.body.note || null,
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
          },
        });

        // 🟢 Catat aktivitas
        await recordActivity({
          tx,
          userId: req.user?.id,
          action: "CREATE_ASSIGNMENT",
          model: MODEL,
          entity: created.platformName,
          entityId: created.accountId,
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

  // 🔹 UPDATE ASSIGNMENT
  async update(req, res) {
    try {
      const data = await prisma.customerAssignment.update({
        where: { id: req.params.id },
        data: {
          platformName: req.body.platformName,
          accountId: req.body.accountId,
          customerName: req.body.customerName,
          operatorId: req.body.operatorId,
          note: req.body.note || null,
          expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        },
      });

      await recordActivity({
        userId: req.user?.id,
        action: "UPDATE_ASSIGNMENT",
        model: MODEL,
        entity: data.platformName,
        entityId: data.accountId,
      });

      res.json({
        success: true,
        message: `${MODEL} updated successfully`,
        data,
      });
    } catch (err) {
      console.error(`❌ Error updating ${MODEL}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 🔹 DELETE ASSIGNMENT
  async delete(req, res) {
    try {
      const deleted = await prisma.customerAssignment.delete({
        where: { id: req.params.id },
      });

      await recordActivity({
        userId: req.user?.id,
        action: "DELETE_ASSIGNMENT",
        model: MODEL,
        entity: deleted.platformName,
        entityId: deleted.accountId,
      });

      res.json({
        success: true,
        message: `${MODEL} deleted successfully`,
      });
    } catch (err) {
      console.error(`❌ Error deleting ${MODEL}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
