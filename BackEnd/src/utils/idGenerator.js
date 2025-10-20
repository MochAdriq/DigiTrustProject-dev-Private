const prisma = require("../config/prisma");
const prefixMaps = require("./prefixMaps");

/**
 * Ambil dan update counter untuk model tertentu.
 * Jika transaksi (tx) diberikan, gunakan tx agar ikut rollback bila gagal.
 */
async function getNextCounter(modelName, tx = prisma) {
  const counter = await tx.counter.upsert({
    where: { name: modelName },
    update: { value: { increment: 1 } },
    create: { name: modelName, value: 1 },
  });
  return counter.value;
}

/**
 * Generate custom ID berdasarkan prefix dan counter.
 * Bisa menerima tx (transaksi Prisma) agar counter aman jika gagal.
 */
async function generateCustomId(modelName, tx = prisma) {
  const prefix = prefixMaps[modelName];

  if (!prefix) {
    throw new Error(`Prefix not found for model: ${modelName}`);
  }

  const counter = await getNextCounter(modelName, tx);
  const formattedCounter = String(counter).padStart(4, "0");

  return `${prefix}-${formattedCounter}`;
}

module.exports = { generateCustomId };
