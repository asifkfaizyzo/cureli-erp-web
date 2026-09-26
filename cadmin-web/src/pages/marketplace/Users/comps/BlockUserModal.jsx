// cadmin-web/src/pages/marketplace/Users/comps/BlockUserModal.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Users/comps/BlockUserModal.jsx

import { useState } from "react";
import { ShieldOff, ShieldCheck, AlertTriangle, X } from "lucide-react";

const BlockUserModal = ({ user, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState("");
  const isBlocking = user?.status !== "suspended";

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isBlocking
              ? "bg-red-50 border-red-100"
              : "bg-emerald-50 border-emerald-100"
          }`}
        >
          <div className="flex items-center gap-3">
            {isBlocking ? (
              <ShieldOff size={18} className="text-red-600" />
            ) : (
              <ShieldCheck size={18} className="text-emerald-600" />
            )}
            <h3
              className={`font-semibold ${
                isBlocking ? "text-red-800" : "text-emerald-800"
              }`}
            >
              {isBlocking ? "Suspend User" : "Reactivate User"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            {isBlocking ? (
              <>
                This will suspend{" "}
                <span className="font-medium text-gray-800">
                  {user.full_name || user.phone}
                </span>{" "}
                and revoke all active sessions immediately. They will not be
                able to log in until reactivated.
              </>
            ) : (
              <>
                This will reactivate{" "}
                <span className="font-medium text-gray-800">
                  {user.full_name || user.phone}
                </span>
                . They will be able to log in again.
              </>
            )}
          </p>

          {isBlocking && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Reason{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Suspicious activity, policy violation..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
              />
            </div>
          )}

          {isBlocking && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertTriangle
                size={14}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-700">
                All active sessions will be revoked immediately upon suspension.
              </p>
            </div>
          )}
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
            onClick={() => onConfirm(isBlocking, reason)}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              isBlocking
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {loading
              ? "Processing..."
              : isBlocking
              ? "Suspend User"
              : "Reactivate User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;