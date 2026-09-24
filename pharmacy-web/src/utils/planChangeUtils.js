// pharmacy-web/src/utils/planChangeUtils.js (do not remove this comment)
// pharmacy-web/src/utils/planChangeUtils.js

/**
 * Plan Change Analysis Utilities
 * Determines upgrade/downgrade direction and compliance requirements
 */

/**
 * Normalize limit values for comparison
 * -1 means unlimited, treat as Infinity
 */
const normalizeLimit = (val) => (val === -1 ? Infinity : val);

/**
 * Analyze plan change direction and impact
 *
 * @param {Object} currentPlan - Current subscription plan
 * @param {Object} targetPlan - Plan user wants to switch to
 * @param {Object} usage - Current active usage { activeUsers, activeBranches }
 * @returns {Object} Analysis result
 */
/**
 * Analyze plan change direction and impact
 * ⚠️ UPDATED: Now handles "renew" direction
 */
export function analyzePlanChange(currentPlan, targetPlan, usage = {}) {
  // ⚠️ NEW: Same plan = renewal
  if (currentPlan.plan_id === targetPlan.plan_id) {
    return {
      direction: "renew",
      hasImpact: false,
      excessUsers: 0,
      excessBranches: 0,
      targetPlan,
      currentPlan,
    };
  }

  // ... rest of existing logic stays the same
  const normalizeLimit = (val) => (val === -1 ? Infinity : val);

  const current = {
    maxUsers: normalizeLimit(currentPlan.max_users),
    maxBranches: normalizeLimit(currentPlan.max_branches),
  };

  const target = {
    maxUsers: normalizeLimit(targetPlan.max_users),
    maxBranches: normalizeLimit(targetPlan.max_branches),
  };

  const userDecrease = target.maxUsers < current.maxUsers;
  const branchDecrease = target.maxBranches < current.maxBranches;
  const isDowngrade = userDecrease || branchDecrease;

  if (isDowngrade) {
    const activeUsers = usage.activeUsers || 0;
    const activeBranches = usage.activeBranches || 0;

    const excessUsers =
      targetPlan.max_users !== -1
        ? Math.max(0, activeUsers - targetPlan.max_users)
        : 0;

    const excessBranches =
      targetPlan.max_branches !== -1
        ? Math.max(0, activeBranches - targetPlan.max_branches)
        : 0;

    const hasImpact = excessUsers > 0 || excessBranches > 0;

    return {
      direction: "downgrade",
      hasImpact,
      excessUsers,
      excessBranches,
      targetPlan,
      currentPlan,
      compliance: {
        users: {
          current: activeUsers,
          allowed: targetPlan.max_users,
          excess: excessUsers,
          needsAction: excessUsers > 0,
        },
        branches: {
          current: activeBranches,
          allowed: targetPlan.max_branches,
          excess: excessBranches,
          needsAction: excessBranches > 0,
        },
      },
    };
  }

  const userIncrease = target.maxUsers > current.maxUsers;
  const branchIncrease = target.maxBranches > current.maxBranches;
  const isUpgrade = (userIncrease || branchIncrease) && !isDowngrade;

  if (isUpgrade) {
    return {
      direction: "upgrade",
      hasImpact: false,
      excessUsers: 0,
      excessBranches: 0,
      targetPlan,
      currentPlan,
    };
  }

  if (targetPlan.price > currentPlan.price) {
    return {
      direction: "upgrade",
      hasImpact: false,
      excessUsers: 0,
      excessBranches: 0,
      targetPlan,
      currentPlan,
    };
  }

  return {
    direction: "no_change",
    hasImpact: false,
    excessUsers: 0,
    excessBranches: 0,
    targetPlan,
    currentPlan,
  };
}

/**
 * Check if compliance requirements are met for downgrade
 *
 * @param {Object} targetPlan - Target plan limits
 * @param {number} activeUsersAfterDisable - Users that will remain active
 * @param {number} activeBranchesAfterDeactivate - Branches that will remain active
 * @returns {Object} Compliance check result
 */
export function checkCompliance(
  targetPlan,
  activeUsersAfterDisable,
  activeBranchesAfterDeactivate,
) {
  const maxUsers =
    targetPlan.max_users === -1 ? Infinity : targetPlan.max_users;
  const maxBranches =
    targetPlan.max_branches === -1 ? Infinity : targetPlan.max_branches;

  const usersCompliant = activeUsersAfterDisable <= maxUsers;
  const branchesCompliant = activeBranchesAfterDeactivate <= maxBranches;

  // Must keep at least 1 branch
  const hasMinimumBranch = activeBranchesAfterDeactivate >= 1;

  return {
    isCompliant: usersCompliant && branchesCompliant && hasMinimumBranch,
    users: {
      compliant: usersCompliant,
      current: activeUsersAfterDisable,
      max: targetPlan.max_users,
    },
    branches: {
      compliant: branchesCompliant && hasMinimumBranch,
      current: activeBranchesAfterDeactivate,
      max: targetPlan.max_branches,
      hasMinimum: hasMinimumBranch,
    },
  };
}

/**
 * Get button text based on plan comparison
 * ⚠️ UPDATED: Added "renew" case
 */
export function getPlanActionText(direction, isCurrent) {
  if (isCurrent) return "Current Plan";

  switch (direction) {
    case "upgrade":
      return "Upgrade";
    case "downgrade":
      return "Downgrade";
    case "renew":
      return "Renew Plan";
    default:
      return "Select";
  }
}
/**
 * Get button style classes based on plan comparison
 */
export function getPlanActionStyles(direction, isCurrent) {
  if (isCurrent) {
    return "bg-gray-100 text-gray-500 cursor-not-allowed";
  }

  switch (direction) {
    case "upgrade":
      return "bg-emerald-600 hover:bg-emerald-700 text-white";
    case "downgrade":
      return "bg-orange-500 hover:bg-orange-600 text-white";
    default:
      return "bg-[#000060] hover:bg-[#000080] text-white";
  }
}

/**
 * Format limit for display
 */
export function formatLimit(value) {
  if (value === -1) return "Unlimited";
  return value.toString();
}

/**
 * Compare two plans and get comparison summary
 */
export function getPlanComparisonSummary(currentPlan, targetPlan) {
  const changes = [];

  // Users comparison
  const currentUsers = currentPlan.max_users;
  const targetUsers = targetPlan.max_users;

  if (currentUsers !== targetUsers) {
    const currentDisplay = formatLimit(currentUsers);
    const targetDisplay = formatLimit(targetUsers);
    const isIncrease =
      normalizeLimit(targetUsers) > normalizeLimit(currentUsers);

    changes.push({
      type: "users",
      label: "User Limit",
      from: currentDisplay,
      to: targetDisplay,
      direction: isIncrease ? "increase" : "decrease",
    });
  }

  // Branches comparison
  const currentBranches = currentPlan.max_branches;
  const targetBranches = targetPlan.max_branches;

  if (currentBranches !== targetBranches) {
    const currentDisplay = formatLimit(currentBranches);
    const targetDisplay = formatLimit(targetBranches);
    const isIncrease =
      normalizeLimit(targetBranches) > normalizeLimit(currentBranches);

    changes.push({
      type: "branches",
      label: "Branch Limit",
      from: currentDisplay,
      to: targetDisplay,
      direction: isIncrease ? "increase" : "decrease",
    });
  }

  // Price comparison
  if (currentPlan.price !== targetPlan.price) {
    changes.push({
      type: "price",
      label: "Annual Price",
      from: currentPlan.price,
      to: targetPlan.price,
      direction: targetPlan.price > currentPlan.price ? "increase" : "decrease",
    });
  }

  return changes;
}
