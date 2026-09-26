// backend/src/modules/mobile/users/mobile.members.service.js (do not remove this comment)
// src/modules/mobile/users/mobile.members.service.js

import prisma from "../../../config/prisma.js";

// ── Helpers ───────────────────────────────────────────────────

/**
 * Compute age in whole years from a date of birth.
 * @param {Date} dob
 * @returns {number}
 */
function computeAge(dob) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Format a family member row for API responses.
 * Computes age from date_of_birth at response time.
 *
 * @param {Object} member - CureliMobileFamilyMember row
 * @returns {Object}
 */
function formatMember(member) {
  return {
    id: member.id,
    name: member.name,
    date_of_birth: member.date_of_birth.toISOString().split("T")[0],
    age: computeAge(member.date_of_birth),
    sex: member.sex,
    phone: member.phone ?? null,
    created_at: member.created_at,
    updated_at: member.updated_at,
  };
}

// ── Service Functions ─────────────────────────────────────────

/**
 * List all non-deleted family members for a user.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function listFamilyMembers(userId) {
  const members = await prisma.cureliMobileFamilyMember.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
    },
    orderBy: { created_at: "asc" },
  });

  return members.map(formatMember);
}

/**
 * Create a new family member.
 *
 * @param {string} userId
 * @param {Object} data - validated fields from createFamilyMemberSchema
 * @returns {Promise<Object>} formatted member
 */
export async function createFamilyMember(userId, data) {
  const member = await prisma.cureliMobileFamilyMember.create({
    data: {
      user_id: userId,
      name: data.name,
      date_of_birth: new Date(data.date_of_birth),
      sex: data.sex,
      phone: data.phone ?? null,
    },
  });

  return formatMember(member);
}

/**
 * Update an existing family member.
 * Only updates provided fields (PATCH semantics).
 * Verifies ownership before updating.
 *
 * @param {string} userId
 * @param {string} memberId
 * @param {Object} data - validated partial fields
 * @returns {Promise<Object>} formatted member
 */
export async function updateFamilyMember(userId, memberId, data) {
  // Verify ownership
  const existing = await prisma.cureliMobileFamilyMember.findFirst({
    where: { id: memberId, user_id: userId, deleted_at: null },
  });

  if (!existing) {
    const err = new Error("Family member not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.date_of_birth !== undefined)
    updateData.date_of_birth = new Date(data.date_of_birth);
  if (data.sex !== undefined) updateData.sex = data.sex;
  if (data.phone !== undefined) updateData.phone = data.phone ?? null;

  const updated = await prisma.cureliMobileFamilyMember.update({
    where: { id: memberId },
    data: updateData,
  });

  return formatMember(updated);
}

/**
 * Soft delete a family member.
 * Verifies ownership before deleting.
 *
 * @param {string} userId
 * @param {string} memberId
 * @returns {Promise<void>}
 */
export async function deleteFamilyMember(userId, memberId) {
  const existing = await prisma.cureliMobileFamilyMember.findFirst({
    where: { id: memberId, user_id: userId, deleted_at: null },
  });

  if (!existing) {
    const err = new Error("Family member not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  await prisma.cureliMobileFamilyMember.update({
    where: { id: memberId },
    data: { deleted_at: new Date() },
  });
}