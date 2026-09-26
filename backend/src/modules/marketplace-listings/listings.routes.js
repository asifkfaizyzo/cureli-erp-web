// backend/src/modules/marketplace-listings/listings.routes.js (do not remove this comment)
// backend/src/modules/marketplace-listings/listings.routes.js

import { Router }      from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate }    from "../../middleware/validate.js";
import * as Controller from "./listings.controller.js";
import {
  getListingsSchema,
  updateListingSchema,
  bulkUpdateSchema,
  categoryVisibilitySchema,
  branchIdQuerySchema,
  listingIdParamSchema,
} from "./listings.schema.js";
import prisma        from "../../config/prisma.js";          // ← ADD
import { success, fail } from "../../utils/response.js";    // ← ADD

const router = Router();

router.use(requireAuth);

// GET /api/marketplace/listings/summary
router.get("/summary", Controller.getBranchSummary);

// GET /api/marketplace/listings/categories
router.get(
  "/categories",
  validate(branchIdQuerySchema, "query"),
  Controller.getCategories
);

// PATCH /api/marketplace/listings/categories
router.patch(
  "/categories",
  requireRole("super_admin", "branch_admin"),
  validate(categoryVisibilitySchema),
  Controller.updateCategoryVisibility
);

// GET /api/marketplace/listings
router.get(
  "/",
  validate(getListingsSchema, "query"),
  Controller.getListings
);

// POST /api/marketplace/listings/sync
router.post(
  "/sync",
  requireRole("super_admin", "branch_admin"),
  validate(branchIdQuerySchema, "query"),
  Controller.syncInventory
);

// POST /api/marketplace/listings/bulk
router.post(
  "/bulk",
  requireRole("super_admin", "branch_admin"),
  validate(bulkUpdateSchema),
  Controller.bulkUpdateListings
);

// GET /api/marketplace/listings/search
// Used by ERP quote builder — MUST be before /:listing_id routes
// No extra auth middleware needed — router.use(requireAuth) covers this
router.get('/search', async (req, res) => {
  try {
    const { branch_id, search, limit = 10 } = req.query;

    if (!branch_id) return fail(res, 'branch_id is required', 400);

    const shopId = req.user.shop_id;

    const listings = await prisma.marketplaceListing.findMany({
      where: {
        branch_id,
        shop_id:    shopId,
        is_visible: true,
        ...(search && search.trim().length >= 2 ? {
          OR: [
            { linkedVariant: { name:  { contains: search.trim(), mode: 'insensitive' } } },
            { linkedVariant: { brand: { contains: search.trim(), mode: 'insensitive' } } },
          ],
        } : {}),
      },
      take: Number(limit),
      select: {
        listing_id:            true,
        marketplace_price:     true,
        requires_prescription: true,
        linkedVariant: {
          select: {
            name:      true,
            brand:     true,
            pack_size: true,
            sku_id:    true,
          },
        },
      },
    });

    const formatted = listings.map((l) => ({
      listing_id:            l.listing_id,
      medicine_name:         l.linkedVariant?.name ?? '',
      brand:                 l.linkedVariant?.brand ?? null,
      pack_size:             l.linkedVariant?.pack_size ?? null,
      marketplace_price:     l.marketplace_price ? Number(l.marketplace_price) : null,
      requires_prescription: l.requires_prescription,
    }));

    return success(res, { listings: formatted });
  } catch (err) {
    console.error('[ListingsSearch] Error:', err.message);
    return fail(res, 'Failed to search listings', 500);
  }
});

// GET /api/marketplace/listings/:listing_id/detail
// IMPORTANT: Must come BEFORE /:listing_id PATCH
router.get(
  "/:listing_id/detail",
  validate(listingIdParamSchema, "params"),
  Controller.getListingDetail
);

// PATCH /api/marketplace/listings/:listing_id
router.patch(
  "/:listing_id",
  requireRole("super_admin", "branch_admin"),
  validate(updateListingSchema),
  Controller.updateListing
);

export default router;