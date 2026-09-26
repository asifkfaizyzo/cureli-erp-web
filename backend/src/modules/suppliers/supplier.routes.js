// backend/src/modules/suppliers/supplier.routes.js (do not remove this comment)
// backend/src/modules/suppliers/supplier.routes.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";

import {
  createSupplierController,
  getSuppliersController,
  getSupplierByIdController,
  updateSupplierController,
  getSupplierBranchesController,
  addSupplierToBranchController,
  removeSupplierFromBranchController,
  bulkUpdateSupplierBranchesController,
  getSuppliersNotInBranchController,
  deactivateSupplierController, //  NEW
  reactivateSupplierController, //  NEW
  removeFromAllBranchesController, //  NEW
} from "./supplier.controller.js";

import {
  createSupplierSchema,
  updateSupplierSchema,
  branchActionSchema,
  bulkBranchUpdateSchema,
} from "./supplier.schema.js";

const router = express.Router();

router.use(requireAuth);

// ============================================
// CRUD Operations
// ============================================
router.post("/", validateBody(createSupplierSchema), createSupplierController);
router.get("/", getSuppliersController);
router.get("/:supplierId", getSupplierByIdController);
router.put(
  "/:supplierId",
  validateBody(updateSupplierSchema),
  updateSupplierController,
);

//  NEW: Supplier Status Management
router.post("/:supplierId/deactivate", deactivateSupplierController);
router.post(
  "/:supplierId/reactivate",
  validateBody(branchActionSchema),
  reactivateSupplierController,
);
router.delete("/:supplierId/all-branches", removeFromAllBranchesController);

// ============================================
// Branch Management (Super Admin Only)
// ============================================
router.get("/:supplierId/branches", getSupplierBranchesController);
router.post(
  "/:supplierId/branches",
  validateBody(branchActionSchema),
  addSupplierToBranchController,
);
router.delete(
  "/:supplierId/branches",
  validateBody(branchActionSchema),
  removeSupplierFromBranchController,
);
router.put(
  "/:supplierId/branches",
  validateBody(bulkBranchUpdateSchema),
  bulkUpdateSupplierBranchesController,
);

// ============================================
// Quick Add - Get suppliers not in specific branch
// ============================================
router.get("/available/:branchId", getSuppliersNotInBranchController);

export default router;
