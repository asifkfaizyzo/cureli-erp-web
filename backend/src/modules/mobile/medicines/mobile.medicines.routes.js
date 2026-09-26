// backend/src/modules/mobile/medicines/mobile.medicines.routes.js (do not remove this comment)
// src/modules/mobile/medicines/mobile.medicines.routes.js
//
// PUBLIC mobile medicine discovery routes.
//
// ROUTE ORDERING IS CRITICAL.
// Express matches routes in declaration order. Static paths must be
// declared before dynamic paths that would otherwise capture them.
//
// Correct order:
//   1. /medicines/feed           — static, must be before /:variantId
//   2. /medicines/categories     — static, must be before /:variantId
//   3. /medicines                — no param segment, safe anywhere
//   4. /medicines/:variantId/shops — sub-resource of a dynamic segment.
//                                    Must be declared BEFORE /:variantId
//                                    so Express does not match the literal
//                                    "shops" as the variantId param.
//   5. /medicines/:variantId     — dynamic, must be last

import { Router } from "express";
import {
  handleGetFeed,
  handleListMedicines,
  handleListCategories,
  handleGetMedicine,
  handleGetMedicineShops,
} from "./mobile.medicines.controller.js";

const router = Router();

// ── Static routes first ───────────────────────────────────────
router.get("/feed", handleGetFeed);
router.get("/categories", handleListCategories);

// ── Paginated catalog ─────────────────────────────────────────
router.get("", handleListMedicines);

// ── Sub-resource of dynamic segment — before /:variantId ─────
// Express sees /medicines/10005/shops and must not match "10005"
// as variantId on the /:variantId route and then 404 on "shops".
// Declaring this route first prevents that capture.
router.get("/:variantId/shops", handleGetMedicineShops);

// ── Dynamic single variant (must be last) ─────────────────────
router.get("/:variantId", handleGetMedicine);

export default router;