// pharmacy-web/src/components/common/notifications/NotificationIcon.jsx (do not remove this comment)
// pharmacy-web/src/components/common/notifications/NotificationIcon.jsx

import React from "react";
import { Megaphone } from "lucide-react";
import {
  getNotificationIconConfig,
  isBroadcastNotification,
} from "../../../config/notifications";

const NotificationIcon = ({ eventType, size = "md", className = "", isMarketplace = false }) => {
  const config = getNotificationIconConfig(eventType);
  const Icon = config.icon;
  const isBroadcast = isBroadcastNotification(eventType);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = { sm: 14, md: 18, lg: 22 };

  // In marketplace dark mode, swap coloured light backgrounds for
  // subtle white-alpha circles so icons stay readable on dark panels.
  const bgClass = isMarketplace ? "bg-white/10" : config.bgColor;
  const ringClass = isMarketplace ? "ring-white/10" : "ring-indigo-200/50";

  if (isBroadcast) {
    return (
      <div
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0
          ${isMarketplace ? "bg-indigo-500/20 ring-2 ring-indigo-500/20" : "bg-gradient-to-br from-indigo-100 to-purple-100 ring-2 ring-indigo-200/50"}
          ${className}
        `}
      >
        <Megaphone
          size={iconSizes[size]}
          className={isMarketplace ? "text-indigo-300" : "text-indigo-600"}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0
        ${bgClass}
        ${className}
      `}
    >
      <Icon
        size={iconSizes[size]}
        className={isMarketplace ? "text-white/60" : config.iconColor}
      />
    </div>
  );
};

export default NotificationIcon;