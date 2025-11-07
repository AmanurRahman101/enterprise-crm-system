/*
  Warnings:

  - You are about to drop the column `stageId` on the `deals` table. All the data in the column will be lost.
  - You are about to drop the `deal_stages` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

-- DropForeignKey
ALTER TABLE "deal_stages" DROP CONSTRAINT "deal_stages_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_stageId_fkey";

-- DropIndex
DROP INDEX "deals_stageId_idx";

-- AlterTable
ALTER TABLE "deals" DROP COLUMN "stageId",
ADD COLUMN     "stage" "DealStage" NOT NULL DEFAULT 'LEAD';

-- DropTable
DROP TABLE "deal_stages";

-- CreateIndex
CREATE INDEX "deals_stage_idx" ON "deals"("stage");
