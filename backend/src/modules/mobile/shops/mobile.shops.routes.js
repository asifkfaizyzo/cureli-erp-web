// backend/src/modules/mobile/shops/mobile.shops.routes.js (do not remove this comment)
// src/modules/mobile/shops/mobile.shops.routes.js
//
// PUBLIC mobile shop discovery routes.
// No auth required — same pattern as mobile.medicines.routes.js.
// Rate-limited at the /mobile mount level in index.js.
//
// ROUTE ORDERING:
//   1. /shops/search           — static, must be before /:shopId
//   2. /shops/:shopId          — dynamic shop profile
//   3. /shops/:shopId/branches/:branchId/medicines — nested dynamic
//
// /shops/search MUST be declared before /:shopId otherwise "search"
// would be captured as a shopId UUID and fail schema validation.

import { Router } from "express";
import {
  handleSearchShops,
  handleGetShopProfile,
  handleGetBranchMedicines,
} from "./mobile.shops.controller.js";

const router = Router();

// ── Static routes first ───────────────────────────────────────
router.get("/search", handleSearchShops);

// ── Shop profile ──────────────────────────────────────────────
router.get("/:shopId", handleGetShopProfile);

// ── Branch medicines (nested, must be last) ───────────────────
router.get(
  "/:shopId/branches/:branchId/medicines",
  handleGetBranchMedicines
);

export default router;