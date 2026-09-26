-- backend/prisma/migrations/20260806052953_add_gradient_colors_to_banner_slides/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "home_banner_slides" ADD COLUMN     "gradient_angle" INTEGER,
ADD COLUMN     "gradient_color_1" VARCHAR(20),
ADD COLUMN     "gradient_color_2" VARCHAR(20);
