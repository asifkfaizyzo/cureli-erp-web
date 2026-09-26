-- backend/prisma/migrations/20260716101405_add_profile_completion_and_family_members/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "UserSex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "patient_age_snapshot" INTEGER,
ADD COLUMN     "patient_is_self" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "patient_name_snapshot" VARCHAR(200),
ADD COLUMN     "patient_sex_snapshot" VARCHAR(10);

-- AlterTable
ALTER TABLE "cureli_mobile_users" ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "profile_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sex" "UserSex";

-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "patient_age_snapshot" INTEGER,
ADD COLUMN     "patient_is_self" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "patient_name_snapshot" VARCHAR(200),
ADD COLUMN     "patient_sex_snapshot" VARCHAR(10);

-- CreateTable
CREATE TABLE "cureli_mobile_family_members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "sex" "UserSex" NOT NULL,
    "phone" VARCHAR(15),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cureli_mobile_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cureli_mobile_family_members_user_id_idx" ON "cureli_mobile_family_members"("user_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_family_members_user_id_deleted_at_idx" ON "cureli_mobile_family_members"("user_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "cureli_mobile_family_members" ADD CONSTRAINT "cureli_mobile_family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cureli_mobile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
