// pharmacy-web/src/components/common/notifications/NotificationItem.jsx (do not remove this comment)
// pharmacy-web/src/components/common/notifications/NotificationItem.jsx

import React from "react";
import { ChevronRight } from "lucide-react";
import NotificationIcon from "./NotificationIcon";
import {
  formatNotificationTime,
  getPriorityConfig,
} from "../../../config/notifications";

const NotificationItem = ({
  notification,
  onClick,
  onHover,
  onHoverEnd,
  isSelected = false,
  showArrow = true,
  variant = "default",
  isMarketplace = false,
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

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const selectedBg = isMarketplace
    ? "bg-white/10 border-l-white/60"
    : "bg-[#000060]/5 border-l-[#000060]";

  const readBg = isMarketplace
    ? "border-l-transparent hover:bg-white/5"
    : "border-l-transparent hover:bg-gray-50";

  const unreadBg = isMarketplace
    ? `bg-white/[0.04] ${priorityConfig.borderColor} hover:bg-white/[0.07]`
    : `${priorityConfig.bgColor} ${priorityConfig.borderColor} hover:bg-gray-50`;

  const titleColor = isMarketplace
    ? is_read
      ? "text-white/60"
      : "text-white"
    : is_read
      ? "text-gray-700"
      : "text-gray-900";

  const messageColor = isMarketplace ? "text-white/40" : "text-gray-500";
  const timeColor = isMarketplace ? "text-white/25" : "text-gray-400";

  const arrowColor = isSelected
    ? isMarketplace
      ? "text-white/80"
      : "text-[#000060]"
    : isMarketplace
      ? "text-white/20"
      : "text-gray-300";

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
        ${isSelected ? selectedBg : is_read ? readBg : unreadBg}
      `}
    >
      {/* Icon */}
      <NotificationIcon
        eventType={event_type}
        size={isCompact ? "sm" : "md"}
        isMarketplace={isMarketplace}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Row */}
        <div className="flex items-center gap-2">
          <p className={`font-medium truncate text-sm ${titleColor}`}>
            {title}
          </p>
          {!is_read && (
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityConfig.dotColor}`}
            />
          )}
        </div>

        {/* Message */}
        <p className={`mt-0.5 line-clamp-2 ${messageColor} ${isCompact ? "text-xs" : "text-sm"}`}>
          {message}
        </p>

        {/* Timestamp */}
        <p className={`mt-1 ${timeColor} ${isCompact ? "text-[10px]" : "text-xs"}`}>
          {formatNotificationTime(created_at)}
        </p>
      </div>

      {/* Arrow */}
      {showArrow && (
        <ChevronRight
          size={isCompact ? 14 : 16}
          className={`flex-shrink-0 mt-1 transition-colors ${arrowColor}`}
        />
      )}
    </button>
  );
};

export default NotificationItem;