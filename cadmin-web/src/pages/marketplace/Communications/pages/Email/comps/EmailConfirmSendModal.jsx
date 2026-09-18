// src/pages/Communications/pages/Broadcast/Email/comps/EmailConfirmSendModal.jsx

import { AlertTriangle, Send, X, Users, Mail, AlertCircle } from "lucide-react";

function EmailConfirmSendModal({
  subject,
  message,
  recipientCount,
  recipientBreakdown,
  quota,
  onConfirm,
  onCancel,
}) {
  const willExceedQuota = quota && recipientCount > quota.remaining;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-amber-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            You are about to send this email broadcast. This action cannot be undone.
          </p>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Subject</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{subject}</p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Message Preview</span>
              <p className="text-sm text-gray-700 mt-0.5 line-clamp-3">{message}</p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700">
                  {recipientCount.toLocaleString()} recipients
                </span>
              </div>
              {recipientBreakdown && (
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {recipientBreakdown.users} shop owners, {recipientBreakdown.cadmins} admins
                </p>
              )}
            </div>
          </div>

          {/* Quota Warning */}
          {willExceedQuota && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Quota Warning</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Only {quota.remaining} emails remaining today. Campaign will pause and resume tomorrow.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#0a0280]"
          >
            <Send size={16} />
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailConfirmSendModal;