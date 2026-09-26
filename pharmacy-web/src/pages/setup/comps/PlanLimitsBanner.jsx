// pharmacy-web/src/pages/setup/comps/PlanLimitsBanner.jsx (do not remove this comment)
// src/components/setup/PlanLimitsBanner.jsx
import { motion } from "framer-motion";
import { Building2, Users, Crown, AlertCircle } from "lucide-react";
import { useSetupStore } from "../../../store/useSetupStore";

const PlanLimitsBanner = ({ variant = "default" }) => {
  const { planLimits, branches, users, superAdmin } = useSetupStore();

  const branchesUsed = branches.length;
  const usersUsed = users.length;
  
  const maxBranches = planLimits.max_branches;
  const maxUsers = planLimits.max_users;
  
  const branchLimitReached = maxBranches !== -1 && branchesUsed >= maxBranches;
  const userLimitReached = maxUsers !== -1 && usersUsed >= maxUsers;

  const formatLimit = (used, max) => {
    if (max === -1) return `${used}/∞`;
    return `${used}/${max}`;
  };

  const getPercentage = (used, max) => {
    if (max === -1) return Math.min(used * 10, 100);
    if (max === 0) return 0;
    return Math.min((used / max) * 100, 100);
  };

  // Minimal variant for mobile header
  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Building2 size={12} className="text-gray-500" />
          <span className={branchLimitReached ? "text-amber-600 font-medium" : "text-gray-600"}>
            {formatLimit(branchesUsed, maxBranches)}
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-gray-500" />
          <span className={userLimitReached ? "text-amber-600 font-medium" : "text-gray-600"}>
            {formatLimit(usersUsed, maxUsers)}
          </span>
        </div>
      </div>
    );
  }

  // Compact variant for sidebar
  if (variant === "compact") {
    return (
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        {/* Plan Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#000060]/10 rounded-lg flex items-center justify-center">
            <Crown size={16} className="text-[#000060]" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Plan</p>
            <p className="text-sm font-semibold text-[#000060]">
              {planLimits.plan_name || "Loading..."}
            </p>
          </div>
        </div>

        {/* Branches */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Branches</span>
            </div>
            <span className={`text-xs font-semibold ${branchLimitReached ? "text-amber-600" : "text-gray-700"}`}>
              {formatLimit(branchesUsed, maxBranches)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(branchesUsed, maxBranches)}%` }}
              className={`h-full rounded-full ${
                branchLimitReached ? "bg-amber-500" : "bg-[#000060]"
              }`}
            />
          </div>
        </div>

        {/* Users */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Users</span>
            </div>
            <span className={`text-xs font-semibold ${userLimitReached ? "text-amber-600" : "text-gray-700"}`}>
              {formatLimit(usersUsed, maxUsers)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(usersUsed, maxUsers)}%` }}
              className={`h-full rounded-full ${
                userLimitReached ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Super Admin */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-semibold text-xs">
                {superAdmin.name?.charAt(0)?.toUpperCase() || "S"}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Super Admin</p>
              <p className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                {superAdmin.name || "You"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default horizontal variant
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Plan Name */}
          <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
            <Crown size={16} className="text-[#000060]" />
            <span className="font-semibold text-sm text-[#000060]">
              {planLimits.plan_name}
            </span>
          </div>

          {/* Branches */}
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-gray-500" />
            <span className="text-xs text-gray-600">Branches:</span>
            <span className={`text-xs font-semibold ${branchLimitReached ? "text-amber-600" : "text-gray-700"}`}>
              {formatLimit(branchesUsed, maxBranches)}
            </span>
            {branchLimitReached && <AlertCircle size={12} className="text-amber-500" />}
          </div>

          {/* Users */}
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-500" />
            <span className="text-xs text-gray-600">Users:</span>
            <span className={`text-xs font-semibold ${userLimitReached ? "text-amber-600" : "text-gray-700"}`}>
              {formatLimit(usersUsed, maxUsers)}
            </span>
            {userLimitReached && <AlertCircle size={12} className="text-amber-500" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanLimitsBanner;