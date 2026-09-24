// cadmin-web/src/pages/Subscription-management/comps/risk/modals/ReminderConfirmModal.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/modals/ReminderConfirmModal.jsx

import { useState } from "react";
import { X, Send, Mail, MessageSquare, Loader2 } from "lucide-react";

export default function ReminderConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  subscription,
  loading = false,
}) {
  const [method, setMethod] = useState("email");

  if (!isOpen || !subscription) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(method);
  };

  const methods = [
    {
      id: "email",
      label: "Email",
      icon: Mail,
      description: subscription.owner_email || "No email available",
      disabled: !subscription.owner_email,
    },
    {
      id: "sms",
      label: "SMS",
      icon: MessageSquare,
      description: subscription.owner_phone || "No phone available",
      disabled: !subscription.owner_phone,
    },
    {
      id: "both",
      label: "Both",
      icon: Send,
      description: "Send via email and SMS",
      disabled: !subscription.owner_email || !subscription.owner_phone,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Send size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Send Payment Reminder
              </h3>
              <p className="text-sm text-gray-500">{subscription.shop_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Send a payment reminder to <strong>{subscription.owner_name}</strong> for
              their subscription expiring on{" "}
              <strong>
                {new Date(
                  subscription.grace_period_until || subscription.end_date
                ).toLocaleDateString()}
              </strong>
              .
            </p>

            {/* Method Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Delivery Method
              </label>
              <div className="space-y-2">
                {methods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <label
                      key={m.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${
                          method === m.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }
                        ${m.disabled ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m.id}
                        checked={method === m.id}
                        onChange={() => setMethod(m.id)}
                        disabled={m.disabled}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <Icon size={18} className="text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{m.label}</p>
                        <p className="text-xs text-gray-500 truncate">{m.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || methods.find((m) => m.id === method)?.disabled}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Reminder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}