// cadmin-web/src/pages/Cadmin-management/comps/SuperAdminSecretDialog.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/SuperAdminSecretDialog.jsx

import { useState, useEffect, useRef } from "react";
import { X, KeyRound, Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";

/**
 * SuperAdminSecretDialog
 *
 * Pops over everything when a Super Admin tries to
 * suspend or activate another Super Admin account.
 *
 * The secret is passed back to the parent via onConfirm(secret).
 * The parent is responsible for calling the API.
 * Error messages from the API are passed back in via apiError.
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   onConfirm    (secret: string) => void
 *   loading      boolean
 *   apiError     string | null
 *   targetName   string   — name of the super admin being acted on
 *   action       "suspend" | "activate"
 */
const SuperAdminSecretDialog = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  apiError = null,
  targetName = "",
  action = "suspend",
}) => {
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSecret("");
      setLocalError("");
      setShowSecret(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!secret.trim()) {
      setLocalError("Please enter the secret.");
      return;
    }
    setLocalError("");
    onConfirm(secret);
  };

  const isSuspend = action === "suspend";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      {/* Backdrop — higher z than AdminDetailsModal (z-50) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl
                   overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 ${
            isSuspend
              ? "bg-gradient-to-r from-red-700 to-red-600"
              : "bg-gradient-to-r from-emerald-700 to-emerald-600"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-lg leading-tight">
                  {isSuspend
                    ? "Deactivate Super Admin"
                    : "Activate Super Admin"}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  Restricted action - secret required
                </p>
              </div>
            </div>
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25
                         disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Explanation */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-sm text-gray-700">
              You are about to{" "}
              <span
                className={`font-semibold ${
                  isSuspend ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {isSuspend ? "deactivate" : "activate"}
              </span>{" "}
              the Super Admin account for{" "}
              <span className="font-semibold text-gray-900">{targetName}</span>.
            </p>
            <p className="text-xs text-gray-500 mt-1.5">
              This action requires the platform secret. Enter it below to
              proceed.
            </p>
          </div>

          {/* Secret input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <KeyRound size={12} />
              Platform Secret
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  if (localError) setLocalError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleSubmit();
                }}
                placeholder="Enter the platform secret…"
                disabled={loading}
                className={`w-full h-11 px-4 pr-11 border rounded-xl text-sm
                           focus:outline-none focus:ring-2 transition-all
                           disabled:bg-gray-50 disabled:text-gray-400
                           ${
                             localError || apiError
                               ? "border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400"
                               : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                           }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowSecret((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Local validation error */}
            {localError && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <ShieldAlert size={12} /> {localError}
              </p>
            )}

            {/* API error (wrong secret, last admin, etc.) */}
            {apiError && (
              <div
                className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5
                              flex items-start gap-2"
              >
                <ShieldAlert
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-700">{apiError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg
                       disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !secret.trim()}
            className={`px-5 py-2 rounded-xl text-sm font-medium text-white
                       flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all
                       ${
                         isSuspend
                           ? "bg-red-600 hover:bg-red-700"
                           : "bg-emerald-600 hover:bg-emerald-700"
                       }`}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <KeyRound size={15} /> Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSecretDialog;
