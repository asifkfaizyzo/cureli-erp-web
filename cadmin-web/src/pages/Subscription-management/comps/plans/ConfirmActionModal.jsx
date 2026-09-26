// cadmin-web/src/pages/Subscription-management/comps/plans/ConfirmActionModal.jsx (do not remove this comment)
// cadmin-web/src/pages/Subscription-management/comps/plans/ConfirmActionModal.jsx

import {
  AlertTriangle,
  CheckCircle,
  Users,
  Copy,
  Trash2,
  PlayCircle,
  PauseCircle,
  Power,
  Archive,
} from "lucide-react";

const ACTION_CONFIG = {
  activate: {
    title: "Activate Plan",
    type: "success",
    icon: PlayCircle,
    confirmText: "Activate Plan",
  },
  suspend: {
    title: "Suspend Plan",
    type: "warning",
    icon: PauseCircle,
    confirmText: "Suspend Plan",
  },
  reactivate: {
    title: "Reactivate Plan",
    type: "success",
    icon: Power,
    confirmText: "Reactivate",
  },
  clone: {
    title: "Clone Plan",
    type: "info",
    icon: Copy,
    confirmText: "Create Clone",
  },
  delete: {
    title: "Delete Draft",
    type: "danger",
    icon: Trash2,
    confirmText: "Delete Draft",
  },
  // ── NEW ────────────────────────────────────────────────────────────────────
  trash: {
    title: "Move to Trash",
    type: "danger",
    icon: Archive,
    confirmText: "Move to Trash",
  },
  // ──────────────────────────────────────────────────────────────────────────
};

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  plan,
  newName = null,
  loading = false,
}) {
  if (!isOpen || !action || !plan) return null;

  const config = ACTION_CONFIG[action];
  if (!config) return null;

  const typeStyles = {
    danger: {
      icon: "bg-red-100 text-red-600",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: "bg-orange-100 text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    success: {
      icon: "bg-emerald-100 text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    info: {
      icon: "bg-blue-100 text-blue-600",
      button: "bg-[#05015A] hover:bg-[#0a0280] text-white",
    },
  };

  const styles = typeStyles[config.type] || typeStyles.danger;
  const Icon = config.icon;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const renderMessage = () => {
    switch (action) {
      case "activate":
        return (
          <div className="space-y-3 text-left">
            <p className="text-gray-600 text-sm">
              You are about to activate <strong>"{plan.name}"</strong>.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="text-amber-600 mt-0.5 flex-shrink-0"
                />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">
                    This action is irreversible:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Plan will become live and billable</li>
                    <li>Plan details can no longer be modified</li>
                    <li>Changes require cloning and creating a new plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "suspend": {
        const subscriberCount = plan.subscriber_count || 0;
        const hasSubscribers = subscriberCount > 0;
        return (
          <div className="space-y-3 text-left">
            <p className="text-gray-600 text-sm">
              You are about to suspend <strong>"{plan.name}"</strong>.
            </p>
            {hasSubscribers ? (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-2">
                  <Users
                    size={16}
                    className="text-orange-600 mt-0.5 flex-shrink-0"
                  />
                  <div className="text-xs text-orange-800">
                    <p className="font-semibold mb-1">
                      This plan has {subscriberCount} active subscriber
                      {subscriberCount !== 1 ? "s" : ""}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>New signups will be blocked immediately</li>
                      <li>
                        Existing subscriptions will continue until expiry
                      </li>
                      <li>
                        Plan will become <strong>DEPRECATED</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-blue-600 mt-0.5 flex-shrink-0"
                  />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">No active subscribers</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Plan will be immediately SUSPENDED</li>
                      <li>Can be reactivated later</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "reactivate":
        return (
          <div className="space-y-3 text-left">
            <p className="text-gray-600 text-sm">
              You are about to reactivate <strong>"{plan.name}"</strong>.
            </p>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-emerald-600 mt-0.5 flex-shrink-0"
                />
                <div className="text-xs text-emerald-800">
                  <p className="font-semibold mb-1">Plan will become active:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>New subscriptions will be accepted</li>
                    <li>Plan will appear on pricing page</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "clone":
        return (
          <div className="space-y-3 text-left">
            <p className="text-gray-600 text-sm">
              Create a draft copy of <strong>"{plan.name}"</strong>.
            </p>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-2">New draft will be created:</p>
                <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                  <Copy size={14} className="text-blue-600" />
                  <span className="font-medium">{newName}</span>
                  <span className="text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 rounded">
                    DRAFT
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "delete":
        return (
          <div className="space-y-3 text-left">
            <p className="text-gray-600 text-sm">
              You are about to delete <strong>"{plan.name}"</strong>.
            </p>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="text-red-600 mt-0.5 flex-shrink-0"
                />
                <div className="text-xs text-red-800">
                  <p className="font-semibold mb-1">
                    This action cannot be undone:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Draft plan will be permanently deleted</li>
                    <li>All plan details will be lost</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      // ── NEW ──────────────────────────────────────────────────────────────
      case "trash":
        return (
          <div className="space-y-3 text-left">
            <p className="text-gray-600 text-sm">
              You are about to move <strong>"{plan.name}"</strong> to trash.
            </p>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <Archive
                  size={16}
                  className="text-red-600 mt-0.5 flex-shrink-0"
                />
                <div className="text-xs text-red-800">
                  <p className="font-semibold mb-1">What happens:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Plan will be hidden from all plan views</li>
                    <li>No new subscriptions can be created for it</li>
                    <li>Existing billing records are preserved</li>
                    <li>
                      Accessible only via the{" "}
                      <strong>Trash</strong> filter
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      // ─────────────────────────────────────────────────────────────────────

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full ${styles.icon} flex items-center justify-center mx-auto mb-4`}
        >
          <Icon size={24} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
          {config.title}
        </h3>

        {/* Message */}
        <div className="mb-6">{renderMessage()}</div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700
                       font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all
                       disabled:opacity-50 flex items-center justify-center gap-2 ${styles.button}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}