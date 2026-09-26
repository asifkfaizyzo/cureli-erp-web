// pharmacy-web/src/pages/notifications/components/NotificationList.jsx (do not remove this comment)
// pharmacy-web/src/pages/notifications/components/NotificationList.jsx

import React from "react";
import {
  Inbox,
  AlertCircle,
  Loader2,
  Megaphone,
  Image,
  Video,
  Link2,
} from "lucide-react";
import { NotificationIcon } from "../../../components/common/notifications";
import {
  formatNotificationTime,
  getPriorityConfig,
  isBroadcastNotification,
} from "../../../config/notifications";

const NotificationList = ({
  notifications,
  isLoading,
  error,
  selectedId,
  onSelect,
  onRetry,
}) => {
  // Loading State
  if (isLoading && notifications.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <AlertCircle size={24} className="text-red-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">Failed to load</p>
        <button
          onClick={onRetry}
          className="text-sm text-[#000060] hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty State
  if (notifications.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Inbox size={28} className="text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No notifications</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.notification_id}
          notification={notification}
          isSelected={selectedId === notification.notification_id}
          onClick={() => onSelect(notification)}
        />
      ))}
    </div>
  );
};

const NotificationListItem = ({ notification, isSelected, onClick }) => {
  const { event_type, title, message, priority, is_read, created_at, context } =
    notification;

  const priorityConfig = getPriorityConfig(priority);
  const isBroadcast = isBroadcastNotification(event_type);

  // Check for attachments
  const attachments = context?.attachments || [];
  const attachment = attachments.length > 0 ? attachments[0] : null;
  const hasActionButton = !!context?.action_url;

  // Attachment icon
  const AttachmentBadge = () => {
    if (!attachment) return null;
    const config = {
      image: { Icon: Image, color: "text-green-500" },
      video: { Icon: Video, color: "text-purple-500" },
      link: { Icon: Link2, color: "text-blue-500" },
    };
    const cfg = config[attachment.type];
    if (!cfg) return null;
    return <cfg.Icon size={12} className={cfg.color} />;
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left transition-all duration-150
        px-4 py-3 flex items-start gap-3
        border-l-[3px]
        ${
          isSelected
            ? isBroadcast
              ? "bg-indigo-50 border-l-indigo-500"
              : "bg-[#000060]/5 border-l-[#000060]"
            : is_read
              ? "border-l-transparent hover:bg-gray-50"
              : isBroadcast
                ? "bg-indigo-50/30 border-l-indigo-400 hover:bg-indigo-50/50"
                : `${priorityConfig.bgColor} ${priorityConfig.borderColor} hover:bg-gray-50`
        }
      `}
    >
      {/* Icon */}
      {isBroadcast ? (
        <div
          className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isSelected || !is_read ? "bg-indigo-100" : "bg-gray-100"}
        `}
        >
          <Megaphone
            size={14}
            className={
              isSelected || !is_read ? "text-indigo-600" : "text-gray-400"
            }
          />
        </div>
      ) : (
        <NotificationIcon eventType={event_type} size="sm" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Row with badges on right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Unread dot */}
            {!is_read && (
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityConfig.dotColor}`}
              />
            )}

            <p
              className={`text-sm truncate ${is_read ? "text-gray-700" : "text-gray-900 font-medium"}`}
            >
              {title}
            </p>
          </div>

          {/* Right side badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <AttachmentBadge />

            {hasActionButton && <Link2 size={12} className="text-blue-400" />}

            {priority !== "normal" && (
              <span
                className={`
                text-[9px] font-semibold px-1.5 py-0.5 rounded
                ${priorityConfig.badgeBg} ${priorityConfig.badgeText}
              `}
              >
                {priority.charAt(0).toUpperCase()}
              </span>
            )}

            {/* Time */}
            <span className="text-[10px] text-gray-400 ml-1">
              {formatNotificationTime(created_at)}
            </span>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{message}</p>
      </div>
    </button>
  );
};

export default NotificationList;
