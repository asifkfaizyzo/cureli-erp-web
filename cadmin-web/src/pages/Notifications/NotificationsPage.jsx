// cadmin-web/src/pages/Notifications/NotificationsPage.jsx (do not remove this comment)
// ============================================
// cadmin-web/src/pages/Notifications/NotificationsPage.jsx
// ============================================

import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  RefreshCw,
  CheckCheck,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";

import NotificationList from "./components/NotificationList";
import NotificationSidePanel from "./components/NotificationSidePanel";
import Pagination from "../../components/common/Pagination";
import { useCAdminNotificationStore } from "../../store/useCAdminNotificationStore";
import { useMenuStore } from "../../store/useMenuStore";
import { useToast } from "../../components/common/Toast";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";

const NotificationsPage = () => {
  const location = useLocation();
  const toast = useToast();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);
  const rowsPerPage = useDynamicRowCount();

  const {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    error,
    filters,
    selectedNotification,
    hasNewNotifications, // ← NEW: SSE flag
    fetchNotifications,
    setFilters,
    goToPage,
    clearFilters,
    markAllAsRead,
    markAsRead,
    setSelectedNotification,
    clearSelectedNotification,
    setHasNewNotifications, // ← NEW: clear SSE flag
  } = useCAdminNotificationStore();

  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // ── Breadcrumbs ──────────────────────────────────────────────────────────
  useEffect(() => {
    setBreadcrumbs(["Notifications"]);
  }, [setBreadcrumbs]);

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications({ limit: rowsPerPage });
  }, [rowsPerPage, fetchNotifications]);

  // ── Pre-select from dropdown navigation ─────────────────────────────────
  useEffect(() => {
    const selectedId = location.state?.selectedNotificationId;
    if (selectedId && notifications.length > 0) {
      const notification = notifications.find(
        (n) => n.notification_id === selectedId,
      );
      if (notification) {
        setSelectedNotification(notification);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, notifications, setSelectedNotification]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    fetchNotifications({ limit: rowsPerPage });
    setHasNewNotifications(false); // ← Clear SSE new-notification flag
    toast.success("Refreshed");
  }, [fetchNotifications, rowsPerPage, toast, setHasNewNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [markAllAsRead, toast]);

  const handleSelectNotification = useCallback(
    (notification) => {
      setSelectedNotification(notification); // store auto-marks as read if unread
    },
    [setSelectedNotification],
  );

  const handleClosePanel = useCallback(() => {
    clearSelectedNotification();
  }, [clearSelectedNotification]);

  const handlePageChange = useCallback(
    (page) => {
      goToPage(page);
      clearSelectedNotification();
    },
    [goToPage, clearSelectedNotification],
  );

  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      try {
        await markAsRead(notificationId);
        toast.success("Marked as read");
      } catch (err) {
        toast.error("Failed to mark as read");
      }
    },
    [markAsRead, toast],
  );

  // ── Filter tabs ──────────────────────────────────────────────────────────

  const filterTabs = [
    { id: "all", label: "All", unreadOnly: false, priority: null },
    {
      id: "unread",
      label: "Unread",
      unreadOnly: true,
      priority: null,
      badge: unreadCount,
    },
    {
      id: "critical",
      label: "Critical",
      unreadOnly: false,
      priority: "critical",
    },
    { id: "high", label: "High", unreadOnly: false, priority: "high" },
  ];

  const getActiveTab = () => {
    if (filters.priority === "critical") return "critical";
    if (filters.priority === "high") return "high";
    if (filters.unreadOnly) return "unread";
    return "all";
  };

  const activeTab = getActiveTab();

  const handleTabClick = useCallback(
    (tab) => {
      clearSelectedNotification();
      setFilters({
        unreadOnly: tab.unreadOnly,
        priority: tab.priority,
      });
    },
    [setFilters, clearSelectedNotification],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    clearSelectedNotification();
  }, [clearFilters, clearSelectedNotification]);

  const hasActiveFilters = filters.unreadOnly || filters.priority;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Title + count */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Bell size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Notifications
              </h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? (
                  <>
                    <span className="text-[#000060] font-medium">
                      {unreadCount} unread
                    </span>
                    {" · "}
                    {pagination.total} total
                  </>
                ) : (
                  <>
                    {pagination.total} notification
                    {pagination.total !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
                className="px-3 py-2 bg-[#000060]/5 text-[#000060] rounded-lg hover:bg-[#000060]/10 transition-all flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
              >
                {isMarkingAllRead ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCheck size={16} />
                )}
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}

            {/* Refresh — with SSE new-notification indicator */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="relative px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />

              {/* ── Pulsing dot shown when SSE pushed a new notification ── */}
              {hasNewNotifications && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-1 min-w-0 overflow-x-auto">
              {filterTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const showBadge = tab.badge && tab.badge > 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      transition-all whitespace-nowrap
                      ${
                        isActive
                          ? "bg-white text-[#000060] shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    {showBadge && (
                      <span
                        className={`
                        inline-flex items-center justify-center min-w-[18px] h-[18px]
                        px-1 text-[10px] font-bold rounded-full
                        ${
                          isActive
                            ? "bg-[#000060] text-white"
                            : "bg-red-500 text-white"
                        }
                      `}
                      >
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <X size={14} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-700 hover:text-red-900 font-medium underline text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 min-h-0 relative flex gap-4 items-start">
        {/* Notification list */}
        <div
          className={`
          flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden
          ${selectedNotification ? "hidden lg:block" : "block"}
        `}
        >
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            error={error}
            selectedId={selectedNotification?.notification_id}
            onSelect={handleSelectNotification}
            onRetry={handleRefresh}
          />
          {pagination.total > 0 && (
            <div className="border-t border-gray-100">
              <Pagination
                currentPage={pagination.page}
                setCurrentPage={handlePageChange}
                totalItems={pagination.total}
                rowsPerPage={rowsPerPage}
              />
            </div>
          )}
        </div>

        {/* Side Panel — Desktop */}
        <AnimatePresence>
          {selectedNotification && (
            <motion.div
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 400 }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="hidden lg:block flex-shrink-0 sticky top-0"
            >
              <NotificationSidePanel
                notification={selectedNotification}
                onClose={handleClosePanel}
                onMarkAsRead={handleMarkAsRead}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side Panel — Mobile */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={handleClosePanel}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-auto"
            >
              <NotificationSidePanel
                notification={selectedNotification}
                onClose={handleClosePanel}
                onMarkAsRead={handleMarkAsRead}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
