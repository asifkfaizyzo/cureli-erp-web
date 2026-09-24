-- backend/prisma/migrations/20251227121847_make_ticket_branch_optional/migration.sql (do not remove this comment)
-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_branch_id_fkey";

-- AlterTable
ALTER TABLE "tickets" ALTER COLUMN "branch_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;
