// backend/src/modules/marketplace/marketplace.holidays.service.js (do not remove this comment)
// backend/src/modules/marketplace/marketplace.holidays.service.js
// NEW FILE

import prisma from '../../config/prisma.js';

// ── List holidays ─────────────────────────────────────────────────────────────

/**
 * Get all upcoming + recent holidays for a shop.
 * Returns both BRANCH and SHOP scope holidays.
 * Ordered by date ascending.
 *
 * @param {string} shop_id
 * @param {string} branch_id - if provided, filter to this branch + shop-wide
 */
export async function listHolidays(shop_id, branch_id = null) {
  const where = branch_id
    ? {
        OR: [
          { branch_id, scope: 'BRANCH' },
          { shop_id,   scope: 'SHOP'   },
        ],
      }
    : { shop_id };

  const holidays = await prisma.branchHoliday.findMany({
    where,
    orderBy: { holiday_date: 'asc' },
    select: {
      holiday_id:   true,
      branch_id:    true,
      shop_id:      true,
      scope:        true,
      holiday_date: true,
      reason:       true,
      created_by:   true,
      created_at:   true,
    },
  });

  return holidays.map((h) => ({
    holiday_id:   h.holiday_id,
    branch_id:    h.branch_id,
    shop_id:      h.shop_id,
    scope:        h.scope,
    holiday_date: h.holiday_date.toISOString().slice(0, 10),
    reason:       h.reason ?? null,
    created_by:   h.created_by,
    created_at:   h.created_at,
  }));
}

// ── Create holiday ────────────────────────────────────────────────────────────

/**
 * Create a holiday override for a branch or entire shop.
 *
 * @param {object} options
 * @param {string}   options.shop_id
 * @param {string}   options.branch_id
 * @param {string}   options.scope        'BRANCH' | 'SHOP'
 * @param {string}   options.holiday_date 'YYYY-MM-DD'
 * @param {string}   [options.reason]
 * @param {string}   options.created_by   user_id
 */
export async function createHoliday({
  shop_id,
  branch_id,
  scope,
  holiday_date,
  reason,
  created_by,
}) {
  // Validate branch belongs to shop
  const branch = await prisma.branchMarketplaceSettings.findFirst({
    where: {
      branch_id,
      marketplaceProfile: { shop_id },
    },
    select: { branch_id: true },
  });

  if (!branch) throw new Error('Branch not found or does not belong to this shop');

  // Parse and validate date
  const dateObj = new Date(`${holiday_date}T00:00:00.000Z`);
  if (isNaN(dateObj.getTime())) throw new Error('Invalid date format — use YYYY-MM-DD');

  // Prevent past holidays (more than 1 day ago)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  if (dateObj < yesterday) throw new Error('Cannot create holidays for past dates');

  try {
    const holiday = await prisma.branchHoliday.create({
      data: {
        branch_id,
        shop_id,
        scope,
        holiday_date: dateObj,
        reason:       reason?.trim() || null,
        created_by,
      },
    });

    return {
      holiday_id:   holiday.holiday_id,
      branch_id:    holiday.branch_id,
      shop_id:      holiday.shop_id,
      scope:        holiday.scope,
      holiday_date: holiday.holiday_date.toISOString().slice(0, 10),
      reason:       holiday.reason ?? null,
      created_at:   holiday.created_at,
    };
  } catch (err) {
    // Unique constraint: same branch + date + scope already exists
    if (err.code === 'P2002') {
      throw new Error('A holiday already exists for this branch on that date');
    }
    throw err;
  }
}

// ── Delete holiday ────────────────────────────────────────────────────────────

/**
 * Delete a holiday override.
 * Verifies the holiday belongs to the shop before deleting.
 *
 * @param {string} holiday_id
 * @param {string} shop_id
 */
export async function deleteHoliday(holiday_id, shop_id) {
  const holiday = await prisma.branchHoliday.findUnique({
    where: { holiday_id },
    select: { holiday_id: true, shop_id: true },
  });

  if (!holiday || holiday.shop_id !== shop_id) {
    throw new Error('Holiday not found');
  }

  await prisma.branchHoliday.delete({ where: { holiday_id } });
}