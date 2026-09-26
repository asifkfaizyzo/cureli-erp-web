-- backend/prisma/migrations/20260417071706_transform_cadmin_roles/migration.sql (do not remove this comment)
-- 1. Add the new column first (with default false)
ALTER TABLE "cadmins" ADD COLUMN "is_super_cadmin" BOOLEAN NOT NULL DEFAULT false;

-- 2. DATA MIGRATION: Set flag based on old enum values BEFORE dropping the column
UPDATE "cadmins" SET "is_super_cadmin" = true WHERE "role"::text = 'SUPER_CADMIN';

-- 3. Now it is safe to drop the old role column
ALTER TABLE "cadmins" DROP COLUMN "role";

-- 4. Drop the old enum type
DROP TYPE "CAdminRole";

-- CreateTable
CREATE TABLE "cadmin_custom_roles" (
    "role_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cadmin_custom_roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "cadmin_role_assignments" (
    "id" UUID NOT NULL,
    "cadmin_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "cadmin_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cadmin_custom_roles_name_key" ON "cadmin_custom_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cadmin_role_assignments_cadmin_id_role_id_key" ON "cadmin_role_assignments"("cadmin_id", "role_id");

-- AddForeignKey
ALTER TABLE "cadmin_role_assignments" ADD CONSTRAINT "cadmin_role_assignments_cadmin_id_fkey" FOREIGN KEY ("cadmin_id") REFERENCES "cadmins"("cadmin_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadmin_role_assignments" ADD CONSTRAINT "cadmin_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "cadmin_custom_roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;