// pharmacy-web/src/components/common/notifications/NotificationDropdown.jsx (do not remove this comment)
// pharmacy-web/src/components/common/notifications/NotificationDropdown.jsx

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
import { getNotificationRoute } from "../../../config/notifications";
import { useNotificationStore } from "../../../store/useNotificationStore";

const NotificationDropdown = ({ isMarketplace = false }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

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
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredNotification, setHoveredNotification] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    startPolling(60000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (isOpen) fetchRecent(5);
  }, [isOpen, fetchRecent]);

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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) setHoveredNotification(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
    setIsOpen(false);
    setHoveredNotification(null);
    navigate("/erp/notifications", {
      state: { selectedNotificationId: notification.notification_id },
    });
  };

  const handleNotificationHover = (notification) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNotification(notification);
    }, 150);
  };

  const handleNotificationHoverEnd = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handlePanelClose = () => setHoveredNotification(null);

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

  // ── Theme tokens ──────────────────────────────────────────────────────────
  // Bell button
  const bellActive = isMarketplace
    ? "bg-white/15 text-white"
    : "bg-[#000060]/10 text-[#000060]";
  const bellIdle = isMarketplace
    ? "text-white/60 hover:bg-white/10 hover:text-white"
    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700";

  // Badge
  const getBadgeColor = () => {
    if (hasCritical) return "bg-red-500";
    if (isMarketplace) return "bg-[#6366f1]";
    return "bg-[#000080]";
  };

  // Dropdown panel
  const panelBg = isMarketplace
    ? "bg-[#0d0a3a] border-white/10 shadow-2xl shadow-black/60"
    : "bg-white border-gray-200 shadow-xl";

  // Header section
  const headerBg = isMarketplace
    ? "bg-white/5 border-white/10"
    : "bg-gray-50/80 border-gray-100";
  const headerTitle = isMarketplace ? "text-white" : "text-gray-800";
  const headerBadgeBg = isMarketplace
    ? "bg-white/10 text-white/50"
    : "bg-gray-200 text-gray-500";

  // Mark-all / refresh buttons
  const markAllClass = isMarketplace
    ? "text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40"
    : "text-[#000060] hover:bg-[#000060]/10 disabled:opacity-50";
  const refreshClass = isMarketplace
    ? "hover:bg-white/10"
    : "hover:bg-gray-200";
  const refreshIcon = isMarketplace ? "text-white/30" : "text-gray-400";

  // List area
  const listDivider = isMarketplace ? "divide-white/5" : "divide-gray-50";

  // Empty / error states
  const emptyIconBg = isMarketplace ? "bg-white/10" : "bg-gray-100";
  const emptyIconColor = isMarketplace ? "text-white/20" : "text-gray-300";
  const emptyTitle = isMarketplace ? "text-white/50" : "text-gray-500";
  const emptySubtitle = isMarketplace ? "text-white/30" : "text-gray-400";
  const loaderColor = isMarketplace ? "text-white/20" : "text-gray-300";
  const loaderText = isMarketplace ? "text-white/40" : "text-gray-500";
  const errorIcon = isMarketplace ? "text-red-400" : "text-red-400";
  const retryLink = isMarketplace
    ? "text-white/60 hover:text-white"
    : "text-[#000060] hover:underline";

  // Footer
  const footerBg = isMarketplace
    ? "bg-white/5 border-white/10"
    : "bg-gray-50/50 border-gray-100";
  const viewAllClass = isMarketplace
    ? "text-white/60 hover:text-white"
    : "text-[#000060] hover:text-[#000080]";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`
          relative p-2 rounded-lg transition-all duration-150
          ${isOpen ? bellActive : bellIdle}
        `}
        aria-label="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span
            className={`
              absolute -top-0.5 -right-0.5
              min-w-[18px] h-[18px]
              flex items-center justify-center
              ${getBadgeColor()}
              text-white text-[10px] font-bold
              rounded-full px-1
              ring-2 ${isMarketplace ? "ring-white/20" : "ring-white"}
              ${hasCritical ? "animate-pulse" : ""}
            `}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`
            absolute right-0 top-full mt-2 w-80 sm:w-96
            rounded-xl border overflow-visible z-50
            ${panelBg}
          `}
        >
          {/* Header */}
          <div
            className={`
              px-4 py-3 border-b flex items-center justify-between
              ${headerBg}
            `}
          >
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${headerTitle}`}>Notifications</h3>
              {unreadCount > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${headerBadgeBg}`}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAllRead}
                  className={`
                    p-1.5 rounded-lg text-xs font-medium
                    transition-colors flex items-center gap-1
                    ${markAllClass}
                  `}
                  title="Mark all as read"
                >
                  {isMarkingAllRead ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={isRecentLoading}
                className={`p-1.5 rounded-lg transition-colors ${refreshClass}`}
                title="Refresh"
              >
                <RefreshCw
                  size={14}
                  className={`${refreshIcon} ${isRecentLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto relative">
            {/* Loading state */}
            {isRecentLoading && recentNotifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Loader2
                  size={24}
                  className={`animate-spin mx-auto mb-2 ${loaderColor}`}
                />
                <p className={`text-sm ${loaderText}`}>
                  Loading notifications...
                </p>
              </div>
            )}

            {/* Error state */}
            {recentError && (
              <div className="px-4 py-8 text-center">
                <AlertCircle
                  size={24}
                  className={`mx-auto mb-2 ${errorIcon}`}
                />
                <p className={`text-sm ${loaderText}`}>{recentError}</p>
                <button
                  onClick={handleRefresh}
                  className={`mt-2 text-sm ${retryLink}`}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isRecentLoading &&
              !recentError &&
              recentNotifications.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${emptyIconBg}`}
                  >
                    <Inbox size={24} className={emptyIconColor} />
                  </div>
                  <p className={`text-sm font-medium ${emptyTitle}`}>
                    All caught up!
                  </p>
                  <p className={`text-xs mt-1 ${emptySubtitle}`}>
                    No notifications yet
                  </p>
                </div>
              )}

            {/* Notification items */}
            {recentNotifications.length > 0 && (
              <div className={`divide-y ${listDivider}`}>
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
                    isMarketplace={isMarketplace}
                  />
                ))}
              </div>
            )}

            <NotificationDetailPanel
              notification={hoveredNotification}
              isVisible={!!hoveredNotification}
              onClose={handlePanelClose}
              onNavigate={handleNotificationClick}
              isMarketplace={isMarketplace}
            />
          </div>

          {/* Footer */}
          <div className={`px-4 py-3 border-t ${footerBg}`}>
            <button
              onClick={handleViewAll}
              className={`w-full text-center text-sm font-medium transition-colors ${viewAllClass}`}
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