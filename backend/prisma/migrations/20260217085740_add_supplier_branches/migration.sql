-- backend/prisma/migrations/20260217085740_add_supplier_branches/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "supplier_branches" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "supplier_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_branches_branch_id_idx" ON "supplier_branches"("branch_id");

-- CreateIndex
CREATE INDEX "supplier_branches_supplier_id_idx" ON "supplier_branches"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_branches_is_active_idx" ON "supplier_branches"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_branches_supplier_id_branch_id_key" ON "supplier_branches"("supplier_id", "branch_id");

-- AddForeignKey
ALTER TABLE "supplier_branches" ADD CONSTRAINT "supplier_branches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_branches" ADD CONSTRAINT "supplier_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE CASCADE ON UPDATE CASCADE;
