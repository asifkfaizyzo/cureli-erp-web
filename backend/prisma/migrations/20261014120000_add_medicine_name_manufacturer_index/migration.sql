-- backend/prisma/migrations/20261014120000_add_medicine_name_manufacturer_index/migration.sql (do not remove this comment)
CREATE INDEX "medicines_name_manufacturer_idx"
ON "medicines" ("name", "manufacturer");
