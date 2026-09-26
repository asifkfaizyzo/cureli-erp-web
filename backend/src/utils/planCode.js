// backend/src/utils/planCode.js (do not remove this comment)
// backend/src/utils/planCode.js

import prisma from "../config/prisma.js";

/**
 * Generates the next available plan code using the DB sequence.
 * Format: PLAN-XXXX (zero-padded to 4 digits, grows beyond 4 if needed)
 *
 * Examples:
 *   PLAN-0001, PLAN-0042, PLAN-1000, PLAN-10000
 *
 * Uses PostgreSQL sequence for collision-safe generation even under
 * concurrent requests.
 */
export async function generatePlanCode(tx = null) {
  const db = tx || prisma;

  const result = await db.$queryRaw`
    SELECT LPAD(nextval('plan_code_seq')::TEXT, 4, '0') AS code
  `;

  const raw = result[0]?.code;
  if (!raw) throw new Error("Failed to generate plan code from sequence");

  return `PLAN-${raw}`;
}