-- backend/prisma/migrations/20260225053743_enum_cadmin/migration.sql (do not remove this comment)
/*
  Warnings:

  - The values [SUPER_ADMIN,ACCOUNTING] on the enum `CAdminRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CAdminRole_new" AS ENUM ('SUPER_CADMIN', 'ANALYST', 'ACCOUNTANT', 'SALESMAN');
ALTER TABLE "public"."cadmins" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "cadmins" ALTER COLUMN "role" TYPE "CAdminRole_new" USING ("role"::text::"CAdminRole_new");
ALTER TYPE "CAdminRole" RENAME TO "CAdminRole_old";
ALTER TYPE "CAdminRole_new" RENAME TO "CAdminRole";
DROP TYPE "public"."CAdminRole_old";
ALTER TABLE "cadmins" ALTER COLUMN "role" SET DEFAULT 'SUPER_CADMIN';
COMMIT;

-- AlterTable
ALTER TABLE "cadmins" ALTER COLUMN "role" SET DEFAULT 'SUPER_CADMIN';
