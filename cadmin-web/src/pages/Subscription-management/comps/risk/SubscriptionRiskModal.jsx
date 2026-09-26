// cadmin-web/src/pages/Subscription-management/comps/risk/SubscriptionRiskModal.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/SubscriptionRiskModal.jsx

import { useState } from "react";
import {
  X,
  Clock,
  Send,
  Ban,
  CheckCircle,
  ExternalLink,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../../components/common/Toast";
import {
  formatDate,
  formatDaysLeft,
  getDaysLeftStyle,
  getPaymentStatusBadge,
} from "../../../../config/modules/subscriptionRiskConfig";

// Import action modals
import ExtendGraceModal from "./modals/ExtendGraceModal";
import ReminderConfirmModal from "./modals/ReminderConfirmModal";
import SuspendConfirmModal from "./modals/SuspendConfirmModal";
// import ReactivateConfirmModal from "./modals/ReactivateConfirmModal";

// API imports - FIXED: Using correct function names from cadminSubscriptions
import {
  extendGracePeriod,
  sendPaymentReminder,
  forceSuspendSubscription,
  reactivateSubscription,
} from "../../../../api/cadminSubscriptions";

export default function SubscriptionRiskModal({
  isOpen,
  subscription,
  category = "expiring", // 'expiring' | 'gracePeriod' | 'suspended'
  onClose,
  onActionComplete,
}) {
  const navigate = useNavigate();
  const toast = useToast();

  // Action modal states
  const [activeModal, setActiveModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !subscription) return null;

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handleExtendGrace = async (days, reason) => {
    setActionLoading(true);
    try {
      await extendGracePeriod(subscription.subscription_id, { days, reason });
      toast.success("Grace Period Extended", `Extended by ${days} days successfully.`);
      setActiveModal(null);
      onActionComplete?.();
      onClose(true);
    } catch (err) {
      toast.error("Failed to Extend", err.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminder = async (method) => {
    setActionLoading(true);
    try {
      await sendPaymentReminder(subscription.subscription_id, { method });
      toast.success("Reminder Sent", `Payment reminder sent via ${method}.`);
      setActiveModal(null);
      onActionComplete?.();
    } catch (err) {
      toast.error("Failed to Send", err.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (reason) => {
    setActionLoading(true);
    try {
      // FIXED: Using forceSuspendSubscription instead of suspendSubscription
      await forceSuspendSubscription(subscription.subscription_id, { reason });
      toast.success("Subscription Suspended", "The subscription has been suspended.");
      setActiveModal(null);
      onActionComplete?.();
      onClose(true);
    } catch (err) {
      toast.error("Failed to Suspend", err.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // const handleReactivate = async (reason, extendDays) => {
  //   setActionLoading(true);
  //   try {
  //     await reactivateSubscription(subscription.subscription_id, { 
  //       reason, 
  //       extend_days: extendDays 
  //     });
  //     toast.success("Subscription Reactivated", "The subscription is now active.");
  //     setActiveModal(null);
  //     onActionComplete?.();
  //     onClose(true);
  //   } catch (err) {
  //     toast.error("Failed to Reactivate", err.response?.data?.message || "Please try again.");
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  const handleNavigateToShop = () => {
    onClose();
    navigate(`/shops?search=${subscription.shop_id}`);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const paymentBadge = getPaymentStatusBadge(subscription.payment_status);
  const daysStyle = getDaysLeftStyle(subscription.days_left);

  // Determine which actions to show based on category
  const getActions = () => {
    switch (category) {
      case "expiring":
        return [
          {
            id: "remind",
            label: "Send Reminder",
            icon: Send,
            color: "blue",
            onClick: () => setActiveModal("remind"),
          },
          {
            id: "extend",
            label: "Extend Grace",
            icon: Clock,
            color: "amber",
            onClick: () => setActiveModal("extend"),
          },
        ];
      case "gracePeriod":
        return [
          {
            id: "remind",
            label: "Send Reminder",
            icon: Send,
            color: "blue",
            onClick: () => setActiveModal("remind"),
          },
          {
            id: "extend",
            label: "Extend Grace",
            icon: Clock,
            color: "amber",
            onClick: () => setActiveModal("extend"),
          },
          {
            id: "suspend",
            label: "Suspend Now",
            icon: Ban,
            color: "red",
            onClick: () => setActiveModal("suspend"),
          },
        ];
      // case "suspended":
      //   return [
      //     {
      //       id: "reactivate",
      //       label: "Reactivate",
      //       icon: CheckCircle,
      //       color: "emerald",
      //       onClick: () => setActiveModal("reactivate"),
      //     },
      //   ];
      default:
        return [];
    }
  };

  const actions = getActions();

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      amber: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      red: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    };
    return colors[color] || colors.blue;
  };

  const getCategoryBadge = () => {
    switch (category) {
      case "expiring":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Clock size={12} />
            Expiring Soon
          </span>
        );
      case "gracePeriod":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <AlertTriangle size={12} />
            Grace Period
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <Ban size={12} />
            Suspended
          </span>
        );
      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => onClose()}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal - Horizontal Layout */}
        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl 
                     animate-in zoom-in-95 fade-in duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#000060] flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    {subscription.shop_name}
                  </h2>
                  {getCategoryBadge()}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={12} />
                  {subscription.shop_city}, {subscription.shop_state}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body - Horizontal Grid Layout */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Subscription Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Subscription
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard size={16} />
                      <span className="text-sm">Plan</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {subscription.plan_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="text-sm">
                        {category === "suspended"
                          ? "Suspended On"
                          : category === "gracePeriod"
                          ? "Grace Ends"
                          : "Expires On"}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatDate(
                        category === "suspended"
                          ? subscription.updated_at
                          : category === "gracePeriod"
                          ? subscription.grace_period_until
                          : subscription.end_date
                      )}
                    </span>
                  </div>

                  {category !== "suspended" && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span className="text-sm">Days Left</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${daysStyle}`}
                      >
                        {subscription.is_critical && <AlertTriangle size={12} />}
                        {formatDaysLeft(subscription.days_left)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard size={16} />
                      <span className="text-sm">Payment</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${paymentBadge.className}`}
                    >
                      {paymentBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Column - Owner Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Owner Details
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-[#000060]/10 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-[#000060]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {subscription.owner_name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">Owner</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Mail size={18} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {subscription.owner_email || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">Email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {subscription.owner_phone || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">Phone</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Quick Actions
                </h3>

                <div className="space-y-2">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${getColorClasses(
                          action.color
                        )}`}
                      >
                        <Icon size={18} />
                        <span className="font-medium">{action.label}</span>
                      </button>
                    );
                  })}

                  {/* View Shop - Always available */}
                  <button
                    onClick={handleNavigateToShop}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 
                               text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <ExternalLink size={18} />
                    <span className="font-medium">View Shop Details</span>
                  </button>
                </div>

                {/* Subscription ID */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400">
                    Subscription ID:{" "}
                    <span className="font-mono">{subscription.subscription_id}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Shop ID: <span className="font-mono">{subscription.shop_id}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => onClose()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                         rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <ExtendGraceModal
        isOpen={activeModal === "extend"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleExtendGrace}
        subscription={subscription}
        loading={actionLoading}
      />

      <ReminderConfirmModal
        isOpen={activeModal === "remind"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleSendReminder}
        subscription={subscription}
        loading={actionLoading}
      />

      <SuspendConfirmModal
        isOpen={activeModal === "suspend"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleSuspend}
        subscription={subscription}
        loading={actionLoading}
      />

      {/* <ReactivateConfirmModal
        isOpen={activeModal === "reactivate"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleReactivate}
        subscription={subscription}
        loading={actionLoading}
      /> */}
    </>
  );
}