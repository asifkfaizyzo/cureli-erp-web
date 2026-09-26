// cadmin-web/src/components/common/notifications/NotificationItem.jsx (do not remove this comment)
// ============================================
// cadmin-web/src/components/common/notifications/NotificationItem.jsx
// ============================================

import React from "react";
import { ChevronRight } from "lucide-react";
import NotificationIcon from "./NotificationIcon";
import {
  formatNotificationTime,
  getPriorityConfig,
} from "../../../config/notifications";

/**
 * NotificationItem - Single notification display
 *
 * @param {Object} notification - Notification data
 * @param {Function} onClick - Click handler
 * @param {Function} onHover - Hover handler (for side panel)
 * @param {Function} onHoverEnd - Hover end handler
 * @param {boolean} isSelected - Whether this item is selected
 * @param {boolean} showArrow - Show right arrow (default: true)
 * @param {string} variant - 'compact' | 'default' (default: 'default')
 */
const NotificationItem = ({
  notification,
  onClick,
  onHover,
  onHoverEnd,
  isSelected = false,
  showArrow = true,
  variant = "default",
}) => {
  const {
    notification_id,
    event_type,
    title,
    message,
    priority,
    is_read,
    created_at,
  } = notification;

  const priorityConfig = getPriorityConfig(priority);
  const isCompact = variant === "compact";

  return (
    <button
      onClick={() => onClick?.(notification)}
      onMouseEnter={() => onHover?.(notification)}
      onMouseLeave={() => onHoverEnd?.()}
      className={`
        w-full text-left transition-all duration-150
        ${isCompact ? "px-3 py-2.5" : "px-4 py-3"}
        flex items-start gap-3
        border-l-[3px]
        ${
          isSelected
            ? "bg-[#000060]/5 border-l-[#000060]"
            : is_read
              ? "border-l-transparent hover:bg-gray-50"
              : `${priorityConfig.bgColor} ${priorityConfig.borderColor} hover:bg-gray-50`
        }
      `}
    >
      {/* Icon */}
      <NotificationIcon eventType={event_type} size={isCompact ? "sm" : "md"} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Row */}
        <div className="flex items-center gap-2">
          <p
            className={`
            font-medium truncate
            ${isCompact ? "text-sm" : "text-sm"}
            ${is_read ? "text-gray-700" : "text-gray-900"}
          `}
          >
            {title}
          </p>

          {/* Unread indicator */}
          {!is_read && (
            <span
              className={`
              w-2 h-2 rounded-full flex-shrink-0
              ${priorityConfig.dotColor}
            `}
            />
          )}
        </div>

        {/* Message */}
        <p
          className={`
          text-gray-500 mt-0.5 line-clamp-2
          ${isCompact ? "text-xs" : "text-sm"}
        `}
        >
          {message}
        </p>

        {/* Timestamp */}
        <p
          className={`
          text-gray-400 mt-1
          ${isCompact ? "text-[10px]" : "text-xs"}
        `}
        >
          {formatNotificationTime(created_at)}
        </p>
      </div>

      {/* Arrow */}
      {showArrow && (
        <ChevronRight
          size={isCompact ? 14 : 16}
          className={`
            flex-shrink-0 mt-1 transition-colors
            ${isSelected ? "text-[#000060]" : "text-gray-300"}
          `}
        />
      )}
    </button>
  );
};

export default NotificationItem;
