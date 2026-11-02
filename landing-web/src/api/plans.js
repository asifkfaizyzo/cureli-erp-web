// landing-web/src/api/plans.js (do not remove this comment)

import API from "./axios";

/**
 * Fetch all active pre-made plans for public display.
 * GET /api/plans
 */
export async function fetchPublicPlans() {
  const res = await API.get("/plans");
  return res.data?.data?.plans ?? [];
}