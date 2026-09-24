// pharmacy-web/src/pages/settings/profile/comps/SessionsCard.jsx (do not remove this comment)
// Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\pages\settings\profile\comps\SessionsCard.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Monitor,
  Smartphone,
  Globe,
  LogOut,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";

import { logoutSession, logoutOtherSessions } from "../../../../api/profile";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";

/**
 * SessionsCard
 * Displays active sessions with logout options - Horizontal Layout
 * Consistent blue theme
 */
const SessionsCard = ({ sessions = [], onUpdate }) => {
  const [logoutingId, setLogoutingId] = useState(null);
  const [logoutingAll, setLogoutingAll] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [error, setError] = useState(null);

  const getDeviceIcon = (deviceInfo) => {
    if (!deviceInfo) return Monitor;
    const lower = deviceInfo.toLowerCase();
    if (
      lower.includes("android") ||
      lower.includes("iphone") ||
      lower.includes("ios") ||
      lower.includes("mobile")
    ) {
      return Smartphone;
    }
    return Monitor;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleLogoutSession = async (sessionId) => {
    setLogoutingId(sessionId);
    setError(null);

    try {
      await logoutSession(sessionId);
      onUpdate();
    } catch (err) {
      console.error("Failed to logout session:", err);
      setError(err.response?.data?.message || "Failed to logout session");
    } finally {
      setLogoutingId(null);
    }
  };

  const handleLogoutAllOthers = async () => {
    setLogoutingAll(true);
    setError(null);

    try {
      await logoutOtherSessions();
      setShowLogoutAllConfirm(false);
      onUpdate();
    } catch (err) {
      console.error("Failed to logout other sessions:", err);
      setError(err.response?.data?.message || "Failed to logout sessions");
    } finally {
      setLogoutingAll(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.is_current);
  const currentSession = sessions.find((s) => s.is_current);

  // Session Card Component
  const SessionItem = ({ session, isCurrent = false }) => {
    const DeviceIcon = getDeviceIcon(session.device_info);
    const isLoggingOut = logoutingId === session.id;

    return (
      <div
        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
          isCurrent
            ? "bg-emerald-50 border-emerald-200"
            : "bg-gray-50 border-gray-100 hover:border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Device Icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isCurrent ? "bg-emerald-100" : "bg-[#000060]/10"
            }`}
          >
            <DeviceIcon
              size={18}
              className={isCurrent ? "text-emerald-600" : "text-[#000060]"}
            />
          </div>

          {/* Session Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-medium truncate ${
                  isCurrent ? "text-emerald-900" : "text-gray-900"
                }`}
              >
                {session.device_info || "Unknown Device"}
              </p>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 text-emerald-700 text-xs font-medium rounded-full flex-shrink-0">
                  <CheckCircle size={10} />
                  Current
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Globe size={10} />
                {session.ip_address || "Unknown IP"}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={10} />
                {formatTimeAgo(session.last_active_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button (not for current session) */}
        {!isCurrent && (
          <button
            onClick={() => handleLogoutSession(session.id)}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 ml-3"
          >
            {isLoggingOut ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <LogOut size={12} />
            )}
            {isLoggingOut ? "..." : "Logout"}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-[#000060]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Active Sessions
              </h2>
              <p className="text-xs text-gray-500">
                {sessions.length} active session
                {sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {otherSessions.length > 0 && (
            <button
              onClick={() => setShowLogoutAllConfirm(true)}
              disabled={logoutingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {logoutingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              Logout All Others
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-auto">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
            >
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-xs font-medium hover:underline ml-4"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Empty State */}
          {sessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 bg-[#000060]/10 rounded-full flex items-center justify-center mb-4">
                <Shield size={32} className="text-[#000060]" />
              </div>
              <p className="text-sm font-medium">No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Session Section */}
              {currentSession && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    This Device
                  </h3>
                  <SessionItem session={currentSession} isCurrent />
                </div>
              )}

              {/* Other Sessions Section */}
              {otherSessions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Other Devices ({otherSessions.length})
                  </h3>
                  {/* Grid layout for other sessions - 2 per row on larger screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {otherSessions.map((session) => (
                      <SessionItem key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Logout All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onClose={() => setShowLogoutAllConfirm(false)}
        onConfirm={handleLogoutAllOthers}
        title="Logout All Other Sessions?"
        message={
          <span>
            This will log you out from <strong>{otherSessions.length}</strong>{" "}
            other device
            {otherSessions.length > 1 ? "s" : ""}. You will remain logged in on
            this device.
          </span>
        }
        confirmText="Logout All Others"
        cancelText="Cancel"
        type="warning"
        loading={logoutingAll}
      />
    </>
  );
};

export default SessionsCard;
