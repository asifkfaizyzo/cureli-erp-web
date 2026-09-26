// backend/src/modules/cadmin/mobile-users/cadminMobileUsers.routes.js (do not remove this comment)
// backend/src/modules/cadmin/mobile-users/cadminMobileUsers.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listUsers,
  getUser,
  editUser,
  editUserPhone,
  blockUser,
  revokeSessions,
  deleteUser,
} from "./cadminMobileUsers.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// ─────────────────────────────────────────────
// LIST + DETAIL
// GET  /cadmin/mobile-users
// GET  /cadmin/mobile-users/:user_id
// ─────────────────────────────────────────────
router.get("/mobile-users", listUsers);
router.get("/mobile-users/:user_id", getUser);

// ─────────────────────────────────────────────
// EDIT PROFILE
// PATCH /cadmin/mobile-users/:user_id
//   body: { full_name?, email? }
// ─────────────────────────────────────────────
router.patch("/mobile-users/:user_id", editUser);

// ─────────────────────────────────────────────
// EDIT PHONE
// PATCH /cadmin/mobile-users/:user_id/phone
//   body: { phone }
// ─────────────────────────────────────────────
router.patch("/mobile-users/:user_id/phone", editUserPhone);

// ─────────────────────────────────────────────
// BLOCK / UNBLOCK
// PATCH /cadmin/mobile-users/:user_id/block
//   body: { block: boolean, reason?: string }
// ─────────────────────────────────────────────
router.patch("/mobile-users/:user_id/block", blockUser);

// ─────────────────────────────────────────────
// FORCE LOGOUT ALL DEVICES
// POST /cadmin/mobile-users/:user_id/revoke-sessions
// ─────────────────────────────────────────────
router.post("/mobile-users/:user_id/revoke-sessions", revokeSessions);

// ─────────────────────────────────────────────
// DELETE ACCOUNT
// DELETE /cadmin/mobile-users/:user_id
//   body: { reason?: string }
// ─────────────────────────────────────────────
router.delete("/mobile-users/:user_id", deleteUser);

export default router;