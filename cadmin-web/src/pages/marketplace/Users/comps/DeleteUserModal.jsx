// cadmin-web/src/pages/marketplace/Users/comps/DeleteUserModal.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Users/comps/DeleteUserModal.jsx

import { useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

const DeleteUserModal = ({ user, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-red-100 bg-red-50">
          <div className="flex items-center gap-2.5">
            <Trash2 size={16} className="text-red-600" />
            <h3 className="font-semibold text-red-800">Delete Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle
              size={16}
              className="text-red-600 flex-shrink-0 mt-0.5"
            />
            <div className="text-sm text-red-700 space-y-1">
              <p className="font-medium">This action is permanent</p>
              <p className="text-xs text-red-600">
                The account for{" "}
                <span className="font-semibold">
                  {user.full_name || user.phone}
                </span>{" "}
                will be permanently deleted. All sessions and addresses will be
                removed. A tombstone record will be created for audit purposes.
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Reason{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Fraudulent account, duplicate, admin request..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
            />
          </div>

          {/* Confirm checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            <span className="text-sm text-gray-700">
              I understand this is irreversible and confirm the deletion of this
              account.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !confirmed}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            {loading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;