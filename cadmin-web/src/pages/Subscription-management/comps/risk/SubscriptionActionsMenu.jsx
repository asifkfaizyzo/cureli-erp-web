// cadmin-web/src/pages/Subscription-management/comps/risk/SubscriptionActionsMenu.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/SubscriptionActionsMenu.jsx

import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Eye,
  Send,
  Clock,
  Ban,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useToast } from "../../../../components/common/Toast";
import {
  sendPaymentReminder,
  extendGracePeriod,
  forceSuspendSubscription,
  reactivateSubscription,
} from "../../../../api/cadminSubscriptions";

// Confirmation modals
import ExtendGraceModal from "./modals/ExtendGraceModal";
import SuspendConfirmModal from "./modals/SuspendConfirmModal";
import ReactivateConfirmModal from "./modals/ReactivateConfirmModal";
import ReminderConfirmModal from "./modals/ReminderConfirmModal";

export default function SubscriptionActionsMenu({
  subscription,
  category, // "expiring" | "gracePeriod" | "suspended"
  isOpen,
  onToggle,
  onClose,
  onViewDetails,
  onNavigateToShop,
  onActionComplete,
}) {
  const toast = useToast();
  const menuRef = useRef(null);

  // Modal states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  // Loading states
  const [actionLoading, setActionLoading] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handleSendReminder = async (method) => {
    setActionLoading(true);
    try {
      await sendPaymentReminder(subscription.subscription_id, { method });
      toast.success(
        "Reminder Sent",
        `Payment reminder sent via ${method} to ${subscription.owner_name}`
      );
      setShowReminderModal(false);
      onClose();
      onActionComplete?.();
    } catch (err) {
      console.error("Failed to send reminder:", err);
      toast.error(
        "Failed to Send",
        err.response?.data?.message || "Could not send payment reminder"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendGrace = async (days, reason) => {
    setActionLoading(true);
    try {
      await extendGracePeriod(subscription.subscription_id, { days, reason });
      toast.success(
        "Grace Period Extended",
        `Extended by ${days} days for ${subscription.shop_name}`
      );
      setShowExtendModal(false);
      onClose();
      onActionComplete?.();
    } catch (err) {
      console.error("Failed to extend grace:", err);
      toast.error(
        "Extension Failed",
        err.response?.data?.message || "Could not extend grace period"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (reason) => {
    setActionLoading(true);
    try {
      await forceSuspendSubscription(subscription.subscription_id, { reason });
      toast.success(
        "Subscription Suspended",
        `${subscription.shop_name} has been suspended`
      );
      setShowSuspendModal(false);
      onClose();
      onActionComplete?.();
    } catch (err) {
      console.error("Failed to suspend:", err);
      toast.error(
        "Suspension Failed",
        err.response?.data?.message || "Could not suspend subscription"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (reason, extendDays) => {
    setActionLoading(true);
    try {
      await reactivateSubscription(subscription.subscription_id, {
        reason,
        extend_days: extendDays,
      });
      toast.success(
        "Subscription Reactivated",
        `${subscription.shop_name} is now active with ${extendDays} days`
      );
      setShowReactivateModal(false);
      onClose();
      onActionComplete?.();
    } catch (err) {
      console.error("Failed to reactivate:", err);
      toast.error(
        "Reactivation Failed",
        err.response?.data?.message || "Could not reactivate subscription"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // DEFINE AVAILABLE ACTIONS PER CATEGORY
  // ============================================

  const getActions = () => {
    const actions = [];

    // View Details - Always available
    actions.push({
      id: "view",
      label: "View Details",
      icon: Eye,
      onClick: () => {
        onViewDetails?.();
        onClose();
      },
      className: "text-gray-700 hover:bg-gray-50",
    });

    // Send Reminder - Expiring & Grace Period
    if (category === "expiring" || category === "gracePeriod") {
      actions.push({
        id: "remind",
        label: "Send Reminder",
        icon: Send,
        onClick: () => {
          setShowReminderModal(true);
          onClose();
        },
        className: "text-blue-600 hover:bg-blue-50",
      });
    }

    // Extend Grace - Grace Period only
    if (category === "gracePeriod") {
      actions.push({
        id: "extend",
        label: "Extend Grace",
        icon: Clock,
        onClick: () => {
          setShowExtendModal(true);
          onClose();
        },
        className: "text-amber-600 hover:bg-amber-50",
      });
    }

    // Force Suspend - Expiring & Grace Period
    if (category === "expiring" || category === "gracePeriod") {
      actions.push({
        id: "suspend",
        label: "Force Suspend",
        icon: Ban,
        onClick: () => {
          setShowSuspendModal(true);
          onClose();
        },
        className: "text-red-600 hover:bg-red-50",
      });
    }

    // Reactivate - Suspended only
    if (category === "suspended") {
      actions.push({
        id: "reactivate",
        label: "Reactivate",
        icon: CheckCircle,
        onClick: () => {
          setShowReactivateModal(true);
          onClose();
        },
        className: "text-emerald-600 hover:bg-emerald-50",
      });
    }

    // View Shop - Always available
    actions.push({
      id: "shop",
      label: "View Shop",
      icon: ExternalLink,
      onClick: () => {
        onNavigateToShop?.();
        onClose();
      },
      className: "text-gray-600 hover:bg-gray-50",
    });

    return actions;
  };

  const actions = getActions();

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Trigger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
        >
          <MoreVertical size={18} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${action.className}`}
                >
                  <Icon size={16} />
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== MODALS ========== */}

      {/* Reminder Modal */}
      <ReminderConfirmModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onConfirm={handleSendReminder}
        subscription={subscription}
        loading={actionLoading}
      />

      {/* Extend Grace Modal */}
      <ExtendGraceModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        onConfirm={handleExtendGrace}
        subscription={subscription}
        loading={actionLoading}
      />

      {/* Suspend Confirm Modal */}
      <SuspendConfirmModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspend}
        subscription={subscription}
        loading={actionLoading}
      />

      {/* Reactivate Confirm Modal */}
      <ReactivateConfirmModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={handleReactivate}
        subscription={subscription}
        loading={actionLoading}
      />
    </>
  );
}