// pharmacy-web/src/pages/settings/users/comps/UserLimitBanner.jsx (do not remove this comment)
// src/pages/settings/components/UserLimitBanner.jsx

import { motion } from "framer-motion";
import { Users, AlertTriangle, CheckCircle2, Infinity } from "lucide-react";

/**
 * UserLimitBanner
 * Shows current user count vs plan limit
 */
const UserLimitBanner = ({ limits }) => {
  const { current_count, max_allowed, can_add, remaining } = limits;

  // Unlimited plan
  if (max_allowed === -1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
      >
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Infinity size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Unlimited Users
          </p>
          <p className="text-xs text-emerald-600">
            {current_count} user{current_count !== 1 ? "s" : ""} created
          </p>
        </div>
      </motion.div>
    );
  }

  // Calculate percentage
  const percentage = Math.round((current_count / max_allowed) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = !can_add;

  // Determine colors
  const bgColor = isAtLimit
    ? "bg-red-50 border-red-200"
    : isNearLimit
    ? "bg-amber-50 border-amber-200"
    : "bg-blue-50 border-blue-200";

  const iconBgColor = isAtLimit
    ? "bg-red-100"
    : isNearLimit
    ? "bg-amber-100"
    : "bg-blue-100";

  const iconColor = isAtLimit
    ? "text-red-600"
    : isNearLimit
    ? "text-amber-600"
    : "text-blue-600";

  const textColor = isAtLimit
    ? "text-red-800"
    : isNearLimit
    ? "text-amber-800"
    : "text-blue-800";

  const subTextColor = isAtLimit
    ? "text-red-600"
    : isNearLimit
    ? "text-amber-600"
    : "text-blue-600";

  const progressBgColor = isAtLimit
    ? "bg-red-200"
    : isNearLimit
    ? "bg-amber-200"
    : "bg-blue-200";

  const progressFillColor = isAtLimit
    ? "bg-red-500"
    : isNearLimit
    ? "bg-amber-500"
    : "bg-blue-500";

  const Icon = isAtLimit ? AlertTriangle : isNearLimit ? AlertTriangle : Users;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-3 border rounded-lg ${bgColor}`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
        <Icon size={20} className={iconColor} />
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {isAtLimit
              ? "User Limit Reached"
              : isNearLimit
              ? "Approaching User Limit"
              : "User Quota"
            }
          </p>
          <p className={`text-sm font-semibold ${textColor}`}>
            {current_count} / {max_allowed}
          </p>
        </div>

        {/* Progress Bar */}
        <div className={`h-2 rounded-full ${progressBgColor}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${progressFillColor}`}
          />
        </div>

        {/* Sub text */}
        <p className={`text-xs mt-1 ${subTextColor}`}>
          {isAtLimit
            ? "Upgrade your plan to add more users"
            : `${remaining} user${remaining !== 1 ? "s" : ""} remaining`
          }
        </p>
      </div>
    </motion.div>
  );
};

export default UserLimitBanner;