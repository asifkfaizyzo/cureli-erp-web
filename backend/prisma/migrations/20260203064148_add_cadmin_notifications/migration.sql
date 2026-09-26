-- backend/prisma/migrations/20260203064148_add_cadmin_notifications/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "cadmin_id" UUID,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_cadmin_id_is_read_created_at_idx" ON "notifications"("cadmin_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_cadmin_id_created_at_idx" ON "notifications"("cadmin_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_cadmin_id_fkey" FOREIGN KEY ("cadmin_id") REFERENCES "cadmins"("cadmin_id") ON DELETE CASCADE ON UPDATE CASCADE;
