// backend/src/modules/medicines/medicine.routes.js (do not remove this comment)
// backend/src/modules/medicines/medicine.routes.js

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";

import {
  createMedicineController,
  getMedicinesController,
  getMedicineByIdController,
  updateMedicineController,
  bulkCreateMedicinesController,
  searchMedicinesController,
  getCatalogLinkStatusController, //  NEW
} from "./medicine.controller.js";

import {
  createMedicineSchema,
  updateMedicineSchema,
  bulkCreateSchema,
} from "./medicine.schema.js";

const router = express.Router();

router.use(requireAuth);

// Search (autocomplete) - must be before /:medicineId to avoid conflict
router.get("/search", searchMedicinesController);

//  NEW: Catalog link status endpoint
router.get("/catalog-link-status", getCatalogLinkStatusController);

// CRUD
router.post("/", validateBody(createMedicineSchema), createMedicineController);
router.post(
  "/bulk",
  validateBody(bulkCreateSchema),
  bulkCreateMedicinesController,
);
router.get("/", getMedicinesController);
router.get("/:medicineId", getMedicineByIdController);
router.put(
  "/:medicineId",
  validateBody(updateMedicineSchema),
  updateMedicineController,
);

export default router;
