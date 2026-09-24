// backend/src/modules/cadmin/coupons/cadminCoupon.routes.js (do not remove this comment)
// backend/src/modules/cadmin/coupons/cadminCoupon.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  handleListCoupons,
  handleGetCouponDetail,
  handleCreateCoupon,
  handleUpdateCoupon,
  handleToggleCouponActive,
  handleDeleteCoupon,
} from "./cadminCoupon.controller.js";

const router = Router();

router.use(requireCAdmin);

router.get(
  "/",
  requireCAdminPermission(CADMIN_PERMISSIONS.COUPONS_VIEW),
  handleListCoupons,
);

router.get(
  "/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.COUPONS_VIEW),
  handleGetCouponDetail,
);

router.post(
  "/",
  requireCAdminPermission(CADMIN_PERMISSIONS.COUPONS_CREATE),
  handleCreateCoupon,
);

router.patch(
  "/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.COUPONS_EDIT),
  handleUpdateCoupon,
);

router.patch(
  "/:id/toggle",
  requireCAdminPermission(CADMIN_PERMISSIONS.COUPONS_TOGGLE_ACTIVE),
  handleToggleCouponActive,
);

router.delete(
  "/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.COUPONS_DELETE),
  handleDeleteCoupon,
);

export default router;