// cadmin-web/src/components/common/notifications/NotificationDetailPanel.jsx (do not remove this comment)
// ============================================
// cadmin-web/src/components/common/notifications/NotificationDetailPanel.jsx
// ============================================

import React from "react";
import {
  X,
  ExternalLink,
  Clock,
  CheckCircle,
  Image,
  Video,
  Link2,
  Megaphone,
} from "lucide-react";
import NotificationIcon from "./NotificationIcon";
import {
  formatNotificationFullDate,
  getPriorityConfig,
  getNotificationRoute,
  isBroadcastNotification,
} from "../../../config/notifications";

const BACKEND_URL = import.meta.env.VITE_API_URL;

/**
 * NotificationDetailPanel - Full details side panel (for dropdown hover)
 */
const NotificationDetailPanel = ({
  notification,
  onClose,
  onNavigate,
  isVisible,
}) => {
  if (!notification || !isVisible) return null;

  const {
    event_type,
    title,
    message,
    priority,
    is_read,
    read_at,
    created_at,
    context,
  } = notification;

  const priorityConfig = getPriorityConfig(priority);
  const isBroadcast = isBroadcastNotification(event_type);
  const route = getNotificationRoute(event_type, context);

  // Extract attachment from context
  const attachments = context?.attachments || [];
  const attachment = attachments.length > 0 ? attachments[0] : null;

  // Resolve attachment URL
  const getAttachmentUrl = (att) => {
    if (!att?.url) return null;
    if (att.url.startsWith("http://") || att.url.startsWith("https://")) {
      return att.url;
    }
    return `${BACKEND_URL}${att.url}`;
  };

  return (
    <div
      className={`
        absolute right-full top-0 mr-2
        w-80 bg-white rounded-xl border border-gray-200 shadow-xl
        transform transition-all duration-200 origin-right
        ${
          isVisible
            ? "opacity-100 scale-100 translate-x-0"
            : "opacity-0 scale-95 translate-x-2 pointer-events-none"
        }
      `}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-start justify-between gap-3 ${
          isBroadcast ? "bg-indigo-50 border-indigo-100" : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          {isBroadcast ? (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Megaphone size={16} className="text-indigo-600" />
            </div>
          ) : (
            <NotificationIcon eventType={event_type} size="sm" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`
                text-[10px] font-medium px-2 py-0.5 rounded-full
                ${priorityConfig.badgeBg} ${priorityConfig.badgeText}
              `}
              >
                {priorityConfig.label}
              </span>
              {is_read && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <CheckCircle size={10} />
                  Read
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Full Message */}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        {/* Attachment Preview (compact) */}
        {attachment && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {attachment.type === "image" ? (
              <div className="rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={getAttachmentUrl(attachment)}
                  alt="Attachment"
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <a
                href={getAttachmentUrl(attachment)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {attachment.type === "video" ? (
                  <Video size={16} className="text-purple-600" />
                ) : (
                  <Link2 size={16} className="text-blue-600" />
                )}
                <span className="text-xs text-gray-600 truncate flex-1">
                  {attachment.label ||
                    attachment.original_name ||
                    (attachment.type === "video" ? "Video attachment" : "Link")}
                </span>
                <ExternalLink size={12} className="text-gray-400" />
              </a>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            <span>{formatNotificationFullDate(created_at)}</span>
          </div>
          {is_read && read_at && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle size={12} />
              <span>Read {formatNotificationFullDate(read_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Navigation (if action_url exists) */}
      {(route || context?.action_url) && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <a
            href={context?.action_url || route}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              w-full flex items-center justify-center gap-2
              px-3 py-2 rounded-lg
              text-sm font-medium transition-colors
              ${
                isBroadcast
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-[#000060] text-white hover:bg-[#000080]"
              }
            `}
          >
            <span>{context?.action_label || "View Details"}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
};

export default NotificationDetailPanel;
