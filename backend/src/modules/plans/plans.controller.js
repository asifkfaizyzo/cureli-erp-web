// backend/src/modules/plans/plans.controller.js (do not remove this comment)
// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\plans\plans.controller.js

import { getActivePlans, getPlanById } from "./plans.service.js";
import { success, fail } from "../../utils/response.js";

/**
 * GET /api/plans
 * Returns ACTIVE + PRE_MADE plans for customer selection
 */
export async function getPlansController(req, res) {
  try {
    const plans = await getActivePlans();
    return success(res, { plans });
  } catch (err) {
    console.error(" Error fetching plans:", err);
    return fail(res, "Failed to load plans.", 500);
  }
}

/**
 * GET /api/plans/:id
 * Fetch single plan details
 */
export async function getPlanByIdController(req, res) {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);

    if (!plan) {
      return fail(res, "Plan not found", 404);
    }

    return success(res, { plan });
  } catch (err) {
    console.error(" Error fetching plan:", err);
    return fail(res, "Failed to load plan.", 500);
  }
}
