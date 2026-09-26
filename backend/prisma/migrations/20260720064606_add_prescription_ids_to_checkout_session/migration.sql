-- backend/prisma/migrations/20260720064606_add_prescription_ids_to_checkout_session/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "prescription_recipient_id" UUID,
ADD COLUMN     "prescription_request_id" UUID;
