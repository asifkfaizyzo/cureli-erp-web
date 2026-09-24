// pharmacy-web/src/pages/settings/plans/comps/CurrentPlanBanner.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/comps/CurrentPlanBanner.jsx

import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  Users,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import {
  formatPrice,
  isIntroPriceActive,
  getIntroPhaseDescription,
} from "../../../../config/planConfig";

const CurrentPlanBanner = ({ subscription, usage }) => {
  if (!subscription) return null;

  const plan = subscription.plan;

  // Intro pricing state
  const introActive = isIntroPriceActive(plan);
  const introDescription = getIntroPhaseDescription(plan);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const endDate = new Date(subscription.end_date);
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)),
  );

  const getStatusStyle = () => {
    if (subscription.status === "active" && daysRemaining > 30) {
      return {
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-100",
      };
    }
    if (daysRemaining <= 30 && daysRemaining > 0) {
      return {
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-100",
      };
    }
    return {
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-100",
    };
  };

  const statusStyle = getStatusStyle();
  const StatusIcon = statusStyle.icon;

  const userLimit = plan.max_users === -1 ? "∞" : plan.max_users;
  const branchLimit = plan.max_branches === -1 ? "∞" : plan.max_branches;

  const userPercentage =
    plan.max_users === -1
      ? 0
      : Math.min(100, (usage.activeUsers / plan.max_users) * 100);
  const branchPercentage =
    plan.max_branches === -1
      ? 0
      : Math.min(100, (usage.activeBranches / plan.max_branches) * 100);

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header strip */}
      <div className="h-1.5 bg-gradient-to-r from-[#000060] to-[#000080]" />

      <div className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Plan info */}
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 bg-[#000060]/10 rounded-xl flex items-center
                            justify-center flex-shrink-0"
            >
              <CreditCard size={24} className="text-[#000060]" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5
                  rounded-full text-xs font-medium
                  ${statusStyle.bg} ${statusStyle.color}`}
                >
                  <StatusIcon size={12} />
                  {subscription.status === "active"
                    ? "Active"
                    : subscription.status}
                </span>
                {/* Intro active indicator */}
                {introActive && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5
                    rounded-full text-xs font-medium
                    bg-sky-100 text-sky-700"
                  >
                    <TrendingDown size={12} />
                    Intro Active
                  </span>
                )}
              </div>

              {/* Always show regular price - what they pay on renewal */}
              <p className="text-sm text-gray-500">
                {formatPrice(plan.price)}/year • Renews{" "}
                {formatDate(subscription.end_date)}
              </p>

              {/* Intro pricing description */}
              {introActive && introDescription && (
                <p className="text-xs text-sky-600 mt-0.5">
                  {introDescription}
                </p>
              )}

              {daysRemaining <= 30 && daysRemaining > 0 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  ⚠️ {daysRemaining} days remaining
                </p>
              )}
            </div>
          </div>

          {/* Right: Usage stats */}
          <div className="flex gap-6">
            {/* Users */}
            <div className="min-w-[140px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Users size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Users</span>
                <span className="text-xs font-semibold text-gray-900 ml-auto">
                  {usage.activeUsers} / {userLimit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${userPercentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${getUsageColor(userPercentage)}`}
                />
              </div>
            </div>

            {/* Branches */}
            <div className="min-w-[140px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Building2 size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">
                  Branches
                </span>
                <span className="text-xs font-semibold text-gray-900 ml-auto">
                  {usage.activeBranches} / {branchLimit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${branchPercentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${getUsageColor(branchPercentage)}`}
                />
              </div>
            </div>

            {/* Validity */}
            <div className="min-w-[100px] text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">
                  Valid Until
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(subscription.end_date)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentPlanBanner;
