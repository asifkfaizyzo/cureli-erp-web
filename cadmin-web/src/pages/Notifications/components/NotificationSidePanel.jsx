// cadmin-web/src/pages/Notifications/components/NotificationSidePanel.jsx (do not remove this comment)
// cadmin-web/src/pages/Notifications/components/NotificationSidePanel.jsx

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Clock,
  CheckCircle,
  Bell,
  Megaphone,
  Link2,
  Image,
  Video,
  Play,
  Download,
  Maximize2,
} from "lucide-react";
import NotificationIcon from "../../../components/common/notifications/NotificationIcon";
import {
  formatNotificationTime,
  formatNotificationFullDate,
  getPriorityConfig,
  isBroadcastNotification,
} from "../../../config/notifications";

const BACKEND_URL = import.meta.env.VITE_API_URL;

const NotificationSidePanel = ({ notification, onClose, onMarkAsRead }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // This component should only render when notification exists
  // Empty state is handled by parent (panel not shown)
  if (!notification) return null;

  const {
    notification_id,
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

  const attachments = context?.attachments || [];
  const actionUrl = context?.action_url;
  const actionLabel = context?.action_label || "View Details";
  const expiresAt = context?.expires_at;
  const attachment = attachments.length > 0 ? attachments[0] : null;

  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  const getAttachmentUrl = (att) => {
    if (!att?.url) return null;
    if (att.url.startsWith("http://") || att.url.startsWith("https://"))
      return att.url;
    return `${BACKEND_URL}${att.url}`;
  };

  const handleAttachmentClick = (att) => {
    if (att.type === "image" && !imageError) {
      setShowFullImage(true);
    } else if (att.url) {
      window.open(getAttachmentUrl(att), "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = (att) => {
    if (att.url) {
      const link = document.createElement("a");
      link.href = getAttachmentUrl(att);
      link.download = att.original_name || att.label || "attachment";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleActionClick = () => {
    if (actionUrl) {
      window.open(actionUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-start justify-between gap-3 ${
          isBroadcast ? "bg-[#000060]/5 border-[#000060]/10" : "border-gray-100"
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          {isBroadcast ? (
            <div className="w-9 h-9 rounded-full bg-[#000060]/10 flex items-center justify-center flex-shrink-0">
              <Megaphone size={16} className="text-[#000060]" />
            </div>
          ) : (
            <NotificationIcon eventType={event_type} size="md" />
          )}

          <div className="flex-1 min-w-0">
            {/* Title with time */}
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm truncate">
                {title}
              </h2>
              <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-0.5">
                <Clock size={9} />
                {formatNotificationTime(created_at)}
              </span>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {isBroadcast && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#000060]/10 text-[#000060] text-[9px] font-semibold rounded">
                  <Megaphone size={8} />
                  ANNOUNCEMENT
                </span>
              )}

              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${priorityConfig.badgeBg} ${priorityConfig.badgeText}`}
              >
                {priorityConfig.label}
              </span>

              {!is_read && (
                <span className="text-[9px] text-[#000060] font-medium flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#000060]" />
                  Unread
                </span>
              )}

              {isExpired && (
                <span className="text-[9px] text-gray-400 flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded">
                  Expired
                </span>
              )}

              {attachment && (
                <span
                  className={`text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                    attachment.type === "image"
                      ? "bg-green-100 text-green-700"
                      : attachment.type === "video"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-[#000060]/10 text-[#000060]"
                  }`}
                >
                  {attachment.type === "image" && <Image size={8} />}
                  {attachment.type === "video" && <Video size={8} />}
                  {attachment.type === "link" && <Link2 size={8} />}
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

      {/* Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {/* Message */}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
          {message}
        </p>

        {/* Image Attachment */}
        {attachment && attachment.type === "image" && (
          <div className="mt-4">
            {!imageError ? (
              <div
                className="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                onClick={() => handleAttachmentClick(attachment)}
              >
                <img
                  src={getAttachmentUrl(attachment)}
                  alt={attachment.label || "Attachment"}
                  className="w-full h-auto max-h-48 object-contain"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullImage(true);
                      }}
                      className="p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
                      title="View full size"
                    >
                      <Maximize2 size={14} className="text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(attachment);
                      }}
                      className="p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
                      title="Download"
                    >
                      <Download size={14} className="text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Image size={16} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  Failed to load image
                </span>
              </div>
            )}
            {attachment.original_name && (
              <p className="text-[10px] text-gray-400 mt-1.5 truncate">
                {attachment.original_name}
                {attachment.size_formatted && ` · ${attachment.size_formatted}`}
              </p>
            )}
          </div>
        )}

        {/* Video Attachment */}
        {attachment && attachment.type === "video" && (
          <div className="mt-4">
            <div
              className="relative rounded-lg overflow-hidden bg-gray-900 cursor-pointer group"
              onClick={() => handleAttachmentClick(attachment)}
            >
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto group-hover:bg-white/30 transition-colors">
                    <Play size={20} className="text-white ml-0.5" />
                  </div>
                  <p className="text-white/70 text-xs mt-2">Click to play</p>
                </div>
              </div>
            </div>
            {attachment.original_name && (
              <p className="text-[10px] text-gray-400 mt-1.5 truncate">
                {attachment.original_name}
                {attachment.size_formatted && ` · ${attachment.size_formatted}`}
              </p>
            )}
          </div>
        )}

        {/* Link Attachment */}
        {attachment && attachment.type === "link" && (
          <button
            onClick={() => handleAttachmentClick(attachment)}
            className="mt-4 w-full flex items-center gap-2 p-2.5 bg-[#000060]/5 border border-[#000060]/10 rounded-lg hover:border-[#000060]/30 hover:bg-[#000060]/10 transition-all group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#000060]/10 flex items-center justify-center flex-shrink-0">
              <Link2 size={14} className="text-[#000060]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {attachment.label || "External Link"}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {(() => {
                  try {
                    return new URL(attachment.url).hostname;
                  } catch {
                    return attachment.url;
                  }
                })()}
              </p>
            </div>
            <ExternalLink
              size={12}
              className="text-gray-400 group-hover:text-[#000060] flex-shrink-0"
            />
          </button>
        )}

        {/* Context Details (non-broadcast) */}
        {!isBroadcast &&
          context &&
          Object.keys(context).filter(
            (k) =>
              ![
                "shop_id",
                "branch_id",
                "user_id",
                "attachments",
                "action_url",
                "action_label",
                "expires_at",
              ].includes(k),
          ).length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="space-y-1.5">
                {Object.entries(context)
                  .filter(
                    ([k]) =>
                      ![
                        "shop_id",
                        "branch_id",
                        "user_id",
                        "attachments",
                        "action_url",
                        "action_label",
                        "expires_at",
                      ].includes(k),
                  )
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-500 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-gray-700 font-medium truncate max-w-[150px]">
                        {String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Timestamps */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            <span>Received: {formatNotificationFullDate(created_at)}</span>
          </div>
          {is_read && read_at && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle size={12} />
              <span>Read: {formatNotificationFullDate(read_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Actions */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {/* Primary Action */}
          {actionUrl && (
            <button
              onClick={handleActionClick}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-[#000060] text-white hover:bg-[#000080]"
            >
              {actionLabel}
              <ExternalLink size={12} />
            </button>
          )}

          {/* Mark as Read */}
          {!is_read && (
            <button
              onClick={() => onMarkAsRead?.(notification_id)}
              className={`${actionUrl ? "" : "flex-1"} flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors`}
            >
              <CheckCircle size={14} />
              <span>Mark as read</span>
            </button>
          )}

          {/* If already read and no action URL, show a message */}
          {is_read && !actionUrl && (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-gray-400">
              <CheckCircle size={14} />
              <span>Already read</span>
            </div>
          )}
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && attachment?.type === "image" && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={getAttachmentUrl(attachment)}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(attachment);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              <Download size={12} />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSidePanel;
