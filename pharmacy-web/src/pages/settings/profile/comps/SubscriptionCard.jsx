// pharmacy-web/src/pages/settings/profile/comps/SubscriptionCard.jsx (do not remove this comment)
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Calendar,
  GitBranch,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  BadgeCheck,
  ClockFading,
  AlertCircle as AlertCircleIcon,
  RefreshCw,
} from "lucide-react";

/**
 * SubscriptionCard
 * Displays subscription and plan information - Horizontal Layout
 * ⚠️ UPDATED: Shows renewal warnings and button when expiry is near
 */
const SubscriptionCard = ({ subscription }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return {
          icon: CheckCircle,
          label: "Active",
          bgColor: "bg-emerald-100",
          textColor: "text-emerald-700",
        };
      case "trial":
        return {
          icon: Clock,
          label: "Trial",
          bgColor: "bg-[#000060]/10",
          textColor: "text-[#000060]",
        };
      case "expired":
        return {
          icon: AlertTriangle,
          label: "Expired",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
        };
      default:
        return {
          icon: Clock,
          label: status || "Unknown",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return { bar: "bg-red-500", text: "text-red-600" };
    if (percentage >= 70)
      return { bar: "bg-amber-500", text: "text-amber-600" };
    return { bar: "bg-[#000060]", text: "text-[#000060]" };
  };

  // No subscription state
  if (!subscription) {
    return (
      <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 bg-[#000060]/10 rounded-full flex items-center justify-center mb-4">
            <CreditCard size={40} className="text-[#000060]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Choose a plan to unlock all features and grow your business
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/erp/settings/upgrade")}
            className="flex items-center gap-2 px-6 py-3 bg-[#000060] text-white rounded-lg font-medium hover:bg-[#000080] transition-colors"
          >
            <Zap size={18} />
            View Plans
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(subscription.status);
  const StatusIcon = statusConfig.icon;
  const branchPercentage = getUsagePercentage(
    subscription.branches_used,
    subscription.branch_limit
  );
  const userPercentage = getUsagePercentage(
    subscription.users_used,
    subscription.user_limit
  );
  const branchColors = getUsageColor(branchPercentage);
  const userColors = getUsageColor(userPercentage);

  // ⚠️ NEW: Renewal warning logic
  const daysRemaining = subscription.days_remaining || 0;
  const isInGrace = subscription.is_in_grace_period || false;
  const needsRenewal = daysRemaining <= 30 || isInGrace;
  const isUrgent = daysRemaining <= 7 || isInGrace;

  // Usage Bar Component - Horizontal
  const UsageBar = ({ icon: Icon, label, used, limit, percentage, colors }) => (
    <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#000060]/10 rounded-lg flex items-center justify-center">
            <Icon size={16} className="text-[#000060]" />
          </div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-bold ${colors.text}`}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${colors.bar}`}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1.5">{limit - used} remaining</p>
    </div>
  );

  // Stat Card Component
  const StatCard = ({
    icon: Icon,
    label,
    value,
    isStatus = false,
    statusConfig = null,
    isWarning = false,
  }) => (
    <div className={`flex-1 flex items-center gap-3 p-4 rounded-xl border min-w-0 ${
      isWarning ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"
    }`}>
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isWarning 
            ? "bg-red-100" 
            : isStatus 
              ? statusConfig?.bgColor 
              : "bg-[#000060]/10"
        }`}
      >
        <Icon
          size={18}
          className={
            isWarning 
              ? "text-red-600" 
              : isStatus 
                ? statusConfig?.textColor 
                : "text-[#000060]"
          }
        />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium truncate ${
          isWarning ? "text-red-600" : "text-gray-500"
        }`}>
          {label}
        </p>
        <p
          className={`text-sm font-bold truncate ${
            isWarning 
              ? "text-red-700" 
              : isStatus 
                ? statusConfig?.textColor 
                : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <CreditCard size={20} className="text-[#000060]" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Subscription & Plan
            </h2>
            <p className="text-xs text-gray-500">
              {subscription.plan_name} •{" "}
              <span className="capitalize">{subscription.billing_cycle}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 ${statusConfig.bgColor} ${statusConfig.textColor} text-xs font-medium rounded-full`}
          >
            <StatusIcon size={12} />
            {statusConfig.label}
          </span>
          
          {/* ⚠️ NEW: Show Renew button when needed */}
          {needsRenewal ? (
            <button
              onClick={() => navigate("/erp/settings/upgrade")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isUrgent
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }`}
            >
              <RefreshCw size={14} />
              {isInGrace ? "Renew Now" : "Renew"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/erp/settings/upgrade")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#000060] hover:bg-[#000060]/10 rounded-lg transition-colors"
            >
              Upgrade
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ⚠️ NEW: Grace Period Warning Banner */}
      {isInGrace && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-3">
          <AlertCircleIcon size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">
              Subscription Expired - Grace Period Active
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Your subscription ended on {formatDate(subscription.end_date)}.
              Grace period ends on {formatDate(subscription.grace_period_until)}.
              Renew now to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {/* ⚠️ NEW: Renewal Warning (30 days, not grace) */}
      {!isInGrace && needsRenewal && (
        <div className={`px-6 py-3 border-b flex items-center gap-3 ${
          isUrgent 
            ? "bg-red-50 border-red-200" 
            : "bg-amber-50 border-amber-200"
        }`}>
          <AlertCircleIcon size={18} className={`flex-shrink-0 ${
            isUrgent ? "text-red-600" : "text-amber-600"
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              isUrgent ? "text-red-900" : "text-amber-900"
            }`}>
              Plan Expiring Soon
            </p>
            <p className={`text-xs mt-0.5 ${
              isUrgent ? "text-red-700" : "text-amber-700"
            }`}>
              Your subscription ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
              Renew now to continue uninterrupted access.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col gap-5">
        {/* Row 1: Plan Details - All 4 cards side by side */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Plan Details
          </h3>
          <div className="flex gap-3">
            <StatCard
              icon={BadgeCheck}
              label="Current Plan"
              value={subscription.plan_name}
            />
            <StatCard
              icon={Calendar}
              label="Billing Cycle"
              value={subscription.billing_cycle}
            />
            <StatCard
              icon={ClockFading}
              label="Valid Until"
              value={formatDate(subscription.end_date)}
              isWarning={needsRenewal}
            />
            <StatCard
              icon={Clock}
              label="Days Remaining"
              value={`${daysRemaining} days`}
              isWarning={needsRenewal}
            />
          </div>
        </div>

        {/* Row 2: Resource Usage - Both bars side by side */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Resource Usage
          </h3>
          <div className="flex gap-3">
            <UsageBar
              icon={GitBranch}
              label="Branches"
              used={subscription.branches_used}
              limit={subscription.branch_limit}
              percentage={branchPercentage}
              colors={branchColors}
            />
            <UsageBar
              icon={Users}
              label="Users"
              used={subscription.users_used}
              limit={subscription.user_limit}
              percentage={userPercentage}
              colors={userColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;