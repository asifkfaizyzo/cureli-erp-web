// cadmin-web/src/components/common/notifications/NotificationDropdown.jsx (do not remove this comment)
// ============================================
// cadmin-web/src/components/common/notifications/NotificationDropdown.jsx
// ============================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCheck,
  Inbox,
} from "lucide-react";
import NotificationItem from "./NotificationItem";
import NotificationDetailPanel from "./NotificationDetailPanel";
import { useCAdminNotificationStore } from "../../../store/useCAdminNotificationStore";

/**
 * NotificationDropdown - Full dropdown component with bell icon
 */
const NotificationDropdown = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Store state
  const {
    recentNotifications,
    unreadCount,
    hasCritical,
    hasHigh,
    isRecentLoading,
    recentError,
    fetchRecent,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  } = useCAdminNotificationStore();

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredNotification, setHoveredNotification] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  // Start polling on mount
  useEffect(() => {
    startPolling(60000); // 60 seconds
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Fetch recent when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchRecent(5);
    }
  }, [isOpen, fetchRecent]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setHoveredNotification(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setHoveredNotification(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHoveredNotification(null);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }

    // Close dropdown
    setIsOpen(false);
    setHoveredNotification(null);

    // Always navigate to notifications page with selected notification
    navigate("/erp/notifications", {
      state: { selectedNotificationId: notification.notification_id },
    });
  };

  const handleNotificationHover = (notification) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set hovered notification after a small delay to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNotification(notification);
    }, 150);
  };

  const handleNotificationHoverEnd = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Don't immediately clear - let the panel handle its own hover
  };

  const handlePanelClose = () => {
    setHoveredNotification(null);
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleRefresh = () => {
    fetchRecent(5);
    fetchUnreadCount();
  };

  const handleViewAll = () => {
    setIsOpen(false);
    setHoveredNotification(null);
    navigate("/erp/notifications");
  };

  // ============================================
  // RENDER
  // ============================================

  // Badge color based on priority
  const getBadgeColor = () => {
    if (hasCritical) return "bg-red-500";
    if (hasHigh) return "bg-orange-500";
    return "bg-[#000060]";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`
          relative p-2 rounded-lg transition-all duration-150
          ${
            isOpen
              ? "bg-[#000060]/10 text-[#000060]"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }
        `}
        aria-label="Notifications"
      >
        <Bell size={20} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className={`
            absolute -top-0.5 -right-0.5 
            min-w-[18px] h-[18px] 
            flex items-center justify-center 
            ${getBadgeColor()} 
            text-white text-[10px] font-bold 
            rounded-full px-1 
            ring-2 ring-white
            ${hasCritical ? "animate-pulse" : ""}
          `}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-xl overflow-visible z-50">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAllRead}
                  className="
                    p-1.5 rounded-lg text-xs font-medium
                    text-[#000060] hover:bg-[#000060]/10
                    transition-colors disabled:opacity-50
                    flex items-center gap-1
                  "
                  title="Mark all as read"
                >
                  {isMarkingAllRead ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                </button>
              )}

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isRecentLoading}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw
                  size={14}
                  className={`text-gray-400 ${isRecentLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto relative">
            {/* Loading State */}
            {isRecentLoading && recentNotifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Loader2
                  size={24}
                  className="animate-spin text-gray-300 mx-auto mb-2"
                />
                <p className="text-sm text-gray-500">
                  Loading notifications...
                </p>
              </div>
            )}

            {/* Error State */}
            {recentError && (
              <div className="px-4 py-8 text-center">
                <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{recentError}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-sm text-[#000060] hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isRecentLoading &&
              !recentError &&
              recentNotifications.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Inbox size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    All caught up!
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    No notifications yet
                  </p>
                </div>
              )}

            {/* Notification Items */}
            {recentNotifications.length > 0 && (
              <div className="divide-y divide-gray-50">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.notification_id}
                    notification={notification}
                    onClick={handleNotificationClick}
                    onHover={handleNotificationHover}
                    onHoverEnd={handleNotificationHoverEnd}
                    isSelected={
                      hoveredNotification?.notification_id ===
                      notification.notification_id
                    }
                    variant="compact"
                  />
                ))}
              </div>
            )}

            {/* Detail Panel (positioned to the left) */}
            <NotificationDetailPanel
              notification={hoveredNotification}
              isVisible={!!hoveredNotification}
              onClose={handlePanelClose}
              onNavigate={handleNotificationClick}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="
                w-full text-center text-sm font-medium 
                text-[#000060] hover:text-[#000080] 
                transition-colors
              "
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
