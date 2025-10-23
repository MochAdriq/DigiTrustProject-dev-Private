/*
  Warnings:

  - You are about to drop the column `is_garansi_only` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `platform_id` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `report_reason` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `platform_id` on the `garansi_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `reported_accounts` table. All the data in the column will be lost.
  - You are about to drop the `platforms` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `platform` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `garansi_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('VIDIO_DIAMOND_MOBILE', 'VIU_1_BULAN', 'WE_TV', 'YT_1_BULAN', 'HBO', 'LOKLOK', 'PRIMEVIDEO', 'SPOTIFY_FAMPLAN_1_BULAN', 'SPOTIFY_FAMPLAN_2_BULAN', 'VIDIO_PLATINUM', 'CANVA_1_BULAN', 'CANVA_1_TAHUN', 'CHAT_GPT', 'DISNEY', 'NETFLIX');

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_platform_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."garansi_accounts" DROP CONSTRAINT "garansi_accounts_platform_id_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "is_garansi_only",
DROP COLUMN "platform_id",
DROP COLUMN "report_reason",
ADD COLUMN     "platform" "PlatformType" NOT NULL;

-- AlterTable
ALTER TABLE "garansi_accounts" DROP COLUMN "platform_id",
ADD COLUMN     "platform" "PlatformType" NOT NULL;

-- AlterTable
ALTER TABLE "reported_accounts" DROP COLUMN "email";

-- DropTable
DROP TABLE "public"."platforms";
