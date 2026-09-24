// cadmin-web/src/components/common/notifications/NotificationIcon.jsx (do not remove this comment)
// ============================================
// cadmin-web/src/components/common/notifications/NotificationIcon.jsx
// ============================================

import React from "react";
import { getNotificationIconConfig } from "../../../config/notifications";

/**
 * NotificationIcon - Renders the appropriate icon for a notification type
 *
 * @param {string} eventType - The notification event type
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} className - Additional classes
 */
const NotificationIcon = ({ eventType, size = "md", className = "" }) => {
  const config = getNotificationIconConfig(eventType);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        flex items-center justify-center 
        ${config.bgColor}
        border ${config.borderColor}
        flex-shrink-0
        ${className}
      `}
    >
      <IconComponent size={iconSizes[size]} className={config.iconColor} />
    </div>
  );
};

export default NotificationIcon;
