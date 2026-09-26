-- backend/prisma/migrations/20251119184847_update_user_shop_nullable/migration.sql (do not remove this comment)
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_shop_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "shop_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE SET NULL ON UPDATE CASCADE;
