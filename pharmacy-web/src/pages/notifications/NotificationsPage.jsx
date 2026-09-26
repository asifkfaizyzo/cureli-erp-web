// pharmacy-web/src/pages/notifications/NotificationsPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/notifications/NotificationsPage.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "../../store/useNotificationStore";
import { deleteNotification } from "../../api/notifications";
import { useToast } from "../../components/common/Toast";
import { Bell, RefreshCw, X, AlertCircle } from "lucide-react";

// Components
import NotificationList from "./components/NotificationList";
import NotificationSidePanel from "./components/NotificationSidePanel";
import InvoicePagination from "../../components/common/Pagination";

// Hook for dynamic row count
import useDynamicRowCount from "../../hooks/useDynamicRowCount";

const NotificationsPage = () => {
  const location = useLocation();
  const toast = useToast();

  // Dynamic row count based on screen height
  const rowsPerPage = useDynamicRowCount();

  // ============================================
  // STORE STATE
  // ============================================
  const {
    notifications,
    pagination,
    filters,
    unreadCount,
    isLoading,
    error,
    selectedNotification,
    fetchNotifications,
    setFilters,
    goToPage,
    clearFilters,
    setSelectedNotification,
    clearSelectedNotification,
    markAsRead,
    refresh,
  } = useNotificationStore();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch with updated limit when rowsPerPage changes
  useEffect(() => {
    fetchNotifications({ limit: rowsPerPage });
  }, [rowsPerPage, fetchNotifications]);

  // Handle pre-selected notification from dropdown navigation
  useEffect(() => {
    const selectedId = location.state?.selectedNotificationId;

    if (selectedId && notifications.length > 0) {
      // Find the notification in the current list
      const notification = notifications.find(
        (n) => n.notification_id === selectedId,
      );

      if (notification) {
        // Select it to open the side panel
        setSelectedNotification(notification);

        // Clear the navigation state so it doesn't persist on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [
    location.state?.selectedNotificationId,
    notifications,
    setSelectedNotification,
  ]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    refresh();
    fetchNotifications({ limit: rowsPerPage });
    toast.success("Refreshed");
  }, [refresh, fetchNotifications, rowsPerPage, toast]);

  const handlePageChange = useCallback(
    (page) => {
      goToPage(page);
      clearSelectedNotification();
    },
    [goToPage, clearSelectedNotification],
  );

  const handleSelectNotification = useCallback(
    (notification) => {
      setSelectedNotification(notification);
      // Auto mark as read when selected
      if (!notification.is_read) {
        markAsRead(notification.notification_id);
      }
    },
    [setSelectedNotification, markAsRead],
  );

  const handleClosePanel = useCallback(() => {
    clearSelectedNotification();
  }, [clearSelectedNotification]);

  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      await markAsRead(notificationId);
    },
    [markAsRead],
  );

  const handleDelete = useCallback(
    async (notificationId) => {
      setIsDeleting(true);
      try {
        const response = await deleteNotification(notificationId);

        if (response.success) {
          toast.success("Notification deleted");
          clearSelectedNotification();
          fetchNotifications({ limit: rowsPerPage });
        } else {
          toast.error("Failed to delete notification");
        }
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("Failed to delete notification");
      } finally {
        setIsDeleting(false);
      }
    },
    [clearSelectedNotification, fetchNotifications, toast, rowsPerPage],
  );

  // Filter tabs configuration
  const filterTabs = [
    { id: "all", label: "All", filter: { unreadOnly: false, priority: null } },
    {
      id: "unread",
      label: "Unread",
      filter: { unreadOnly: true, priority: null },
      badge: unreadCount,
    },
    {
      id: "critical",
      label: "Critical",
      filter: { unreadOnly: false, priority: "critical" },
    },
    {
      id: "high",
      label: "High",
      filter: { unreadOnly: false, priority: "high" },
    },
  ];

  // Determine active tab
  const getActiveTab = () => {
    if (filters.priority === "critical") return "critical";
    if (filters.priority === "high") return "high";
    if (filters.unreadOnly) return "unread";
    return "all";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab) => {
    clearFilters();
    if (tab.filter.unreadOnly) {
      setFilters({ unreadOnly: true });
    }
    if (tab.filter.priority) {
      setFilters({ priority: tab.filter.priority });
    }
    clearSelectedNotification();
  };

  const handleClearFilters = () => {
    clearFilters();
    clearSelectedNotification();
  };

  // Check if any filter is active
  const hasActiveFilters = filters.unreadOnly || filters.priority;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
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

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-1 min-w-0 overflow-x-auto">
              {filterTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const showBadge = tab.badge && tab.badge > 0;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
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
                        inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                        text-[10px] font-bold rounded-full
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

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 
                           hover:bg-red-50 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <X size={14} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
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

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative flex gap-4 items-start">
        {/* Notification List */}
        <div
          className={`flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden ${
            selectedNotification ? "hidden lg:block" : "block"
          }`}
        >
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            error={error}
            selectedId={selectedNotification?.notification_id}
            onSelect={handleSelectNotification}
            onRetry={handleRefresh}
          />

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="border-t border-gray-100">
              <InvoicePagination
                currentPage={pagination.page}
                setCurrentPage={handlePageChange}
                totalItems={pagination.total}
                rowsPerPage={pagination.limit}
              />
            </div>
          )}
        </div>

        {/* Side Panel - Desktop (Animated slide-in) */}
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
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Side Panel (Full screen slide-over) */}
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
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
