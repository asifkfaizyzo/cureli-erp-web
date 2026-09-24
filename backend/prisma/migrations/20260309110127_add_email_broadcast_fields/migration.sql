-- backend/prisma/migrations/20260309110127_add_email_broadcast_fields/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "email_broadcast_campaigns" ADD COLUMN     "action_label" VARCHAR(100),
ADD COLUMN     "action_url" VARCHAR(500),
ADD COLUMN     "target_cadmins" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "target_users" BOOLEAN NOT NULL DEFAULT true;
