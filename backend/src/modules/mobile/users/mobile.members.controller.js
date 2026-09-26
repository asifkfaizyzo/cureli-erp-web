// backend/src/modules/mobile/users/mobile.members.controller.js (do not remove this comment)
// src/modules/mobile/users/mobile.members.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  listFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "./mobile.members.service.js";

/**
 * GET /mobile/users/members
 */
export async function handleListMembers(req, res) {
  try {
    const members = await listFamilyMembers(req.mobileUser.id);
    return success(res, { members }, "Family members fetched");
  } catch {
    return fail(res, "Failed to fetch family members", 500);
  }
}

/**
 * POST /mobile/users/members
 */
export async function handleCreateMember(req, res) {
  try {
    const member = await createFamilyMember(req.mobileUser.id, req.body);
    return success(res, { member }, "Family member added", 201);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}

/**
 * PATCH /mobile/users/members/:id
 */
export async function handleUpdateMember(req, res) {
  try {
    const member = await updateFamilyMember(
      req.mobileUser.id,
      req.params.id,
      req.body,
    );
    return success(res, { member }, "Family member updated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}

/**
 * DELETE /mobile/users/members/:id
 */
export async function handleDeleteMember(req, res) {
  try {
    await deleteFamilyMember(req.mobileUser.id, req.params.id);
    return success(res, {}, "Family member removed");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}