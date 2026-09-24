-- backend/prisma/migrations/20251222091613_make_branch_address_optional/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "branches" ALTER COLUMN "address_line_1" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "pincode" DROP NOT NULL,
ALTER COLUMN "contact_number" DROP NOT NULL;
