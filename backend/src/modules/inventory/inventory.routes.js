// backend/src/modules/inventory/inventory.routes.js (do not remove this comment)
// backend/src/modules/inventory/inventory.routes.js

import express from "express";
import inventoryController from "./inventory.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createAdjustmentSchema,
  updateInventorySchema,
  createInventoryWithMedicineSchema,
  
} from "./inventory.schema.js";

const router = express.Router();

router.use(requireAuth);

// ── Inventory queries ──────────────────────────────────────────────────────
router.get("/", inventoryController.getInventory);
router.get("/summary", inventoryController.getStockSummary);
router.get("/low-stock", inventoryController.getLowStock);
router.get("/expiring-soon", inventoryController.getExpiringSoon);
router.get("/medicine/:medicineId", inventoryController.getByMedicine);

// ── NEW: Expose filter facets metadata ────────────────────────────────────
router.get("/facets", inventoryController.getInventoryFacets);

// ── Export & Reset ─────────────────────────────────────────────────────────
router.get("/export", inventoryController.exportInventory);
router.post("/reset", inventoryController.resetInventory);
// ── Stock ledger ───────────────────────────────────────────────────────────
router.get("/ledger", inventoryController.getStockLedger);

// ── NEW: Create inventory + medicine in one shot ───────────────────────────
router.post(
  "/create-with-medicine",
  validate(createInventoryWithMedicineSchema),
  (req, res) => inventoryController.createInventoryWithMedicine(req, res),
);

// ── Stock adjustment ───────────────────────────────────────────────────────
router.post(
  "/adjustment",
  validate(createAdjustmentSchema),
  inventoryController.createAdjustment,
);

// ── CRUD on existing inventory items ──────────────────────────────────────
router.put(
  "/:inventoryId",
  validate(updateInventorySchema),
  inventoryController.updateInventory,
);
router.delete("/:inventoryId", inventoryController.deleteInventory);

export default router;
