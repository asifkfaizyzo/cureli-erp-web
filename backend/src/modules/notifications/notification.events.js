// ============================================
// backend\src\modules\notifications\notification.events.js
// ============================================

export const NOTIFICATION_EVENTS = {
  // ─────────────────────────────────────────
  // SECURITY & ACCESS
  // ─────────────────────────────────────────
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_BY_ADMIN: "PASSWORD_RESET_BY_ADMIN",
  EMAIL_CHANGED: "EMAIL_CHANGED",
  EMAIL_CHANGE_OTP: "EMAIL_CHANGE_OTP",
  EMAIL_VERIFICATION_OTP: "EMAIL_VERIFICATION_OTP",
  PHONE_CHANGED: "PHONE_CHANGED",
  ROLE_CHANGED: "ROLE_CHANGED",
  BRANCH_CHANGED: "BRANCH_CHANGED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_REACTIVATED: "USER_REACTIVATED",

  // ─────────────────────────────────────────
  // BROADCAST (Multi-Channel)
  // ─────────────────────────────────────────
  BROADCAST_INAPP: "BROADCAST_INAPP",
  BROADCAST_EMAIL: "BROADCAST_EMAIL",
  BROADCAST_SMS: "BROADCAST_SMS",
  BROADCAST_WHATSAPP: "BROADCAST_WHATSAPP", // Future-ready

  // ─────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────
  USER_CREATED: "USER_CREATED",
  USER_INVITED: "USER_INVITED",

  // ─────────────────────────────────────────
  // SHOP & VERIFICATION
  // ─────────────────────────────────────────
  SHOP_VERIFIED: "SHOP_VERIFIED",
  DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
  DOCUMENT_PARTIALLY_REJECTED: "DOCUMENT_PARTIALLY_REJECTED",

  // ─────────────────────────────────────────
  // SUBSCRIPTION LIFECYCLE
  // ─────────────────────────────────────────
  SUBSCRIPTION_ACTIVATED: "SUBSCRIPTION_ACTIVATED",
  SUBSCRIPTION_EXPIRING_7_DAYS: "SUBSCRIPTION_EXPIRING_7_DAYS",
  SUBSCRIPTION_EXPIRING_3_DAYS: "SUBSCRIPTION_EXPIRING_3_DAYS",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  SUBSCRIPTION_GRACE_STARTED: "SUBSCRIPTION_GRACE_STARTED",
  SUBSCRIPTION_GRACE_ENDING: "SUBSCRIPTION_GRACE_ENDING",
  SUBSCRIPTION_GRACE_EXTENDED: "SUBSCRIPTION_GRACE_EXTENDED",
  SUBSCRIPTION_SUSPENDED: "SUBSCRIPTION_SUSPENDED",
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",
  SUBSCRIPTION_PAYMENT_REMINDER: "SUBSCRIPTION_PAYMENT_REMINDER",
  PLAN_UPGRADED: "PLAN_UPGRADED",
  PLAN_DOWNGRADED: "PLAN_DOWNGRADED",

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",

  // ─────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────
  LOW_STOCK_ALERT: "LOW_STOCK_ALERT",
  OUT_OF_STOCK_ALERT: "OUT_OF_STOCK_ALERT",
  NEAR_EXPIRY_ALERT: "NEAR_EXPIRY_ALERT",
  EXPIRED_STOCK_ALERT: "EXPIRED_STOCK_ALERT",

  // ─────────────────────────────────────────
  // MEDICINE LINKING
  // ─────────────────────────────────────────
  MEDICINE_LINKED: "MEDICINE_LINKED",
  MEDICINE_UNLINKED: "MEDICINE_UNLINKED",
  MEDICINE_RESUBMITTED: "MEDICINE_RESUBMITTED",

  // ─────────────────────────────────────────
  // TICKETS
  // ─────────────────────────────────────────
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_STATUS_CHANGED: "TICKET_STATUS_CHANGED",

  // ─────────────────────────────────────────
  // ENQUIRIES
  // ─────────────────────────────────────────
  ENQUIRY_RECEIVED: "ENQUIRY_RECEIVED",
  ENQUIRY_REPLIED: "ENQUIRY_REPLIED",

  // ─────────────────────────────────────────
  // CADMIN PASSWORD RESET (Email Only)
  // ─────────────────────────────────────────
  CADMIN_PASSWORD_RESET_REQUESTED: "CADMIN_PASSWORD_RESET_REQUESTED",

  // ─────────────────────────────────────────
  // SYSTEM / BROADCAST (Email Only)
  // ─────────────────────────────────────────
  SYSTEM_BROADCAST: "SYSTEM_BROADCAST",

  // ─────────────────────────────────────────
  // MARKETPLACE ORDERS
  // ─────────────────────────────────────────
  MARKETPLACE_ORDER_PLACED: "MARKETPLACE_ORDER_PLACED",
  MARKETPLACE_ORDER_CANCELLED: "MARKETPLACE_ORDER_CANCELLED",
};

// ============================================
// EVENT METADATA - Defines behavior per event
// ============================================

export const EVENT_CONFIG = {
  // ─────────────────────────────────────────
  // SECURITY & ACCESS
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.PASSWORD_CHANGED]: {
    description: "User changed their password",
    defaultChannels: ["email", "inapp"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PASSWORD_RESET_REQUESTED]: {
    description: "User requested password reset",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.PASSWORD_RESET_BY_ADMIN]: {
    description: "Admin reset user password",
    defaultChannels: ["email", "inapp"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.EMAIL_CHANGED]: {
    description: "Email address changed",
    defaultChannels: ["email", "inapp"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.EMAIL_CHANGE_OTP]: {
    description: "OTP for email change verification",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.EMAIL_VERIFICATION_OTP]: {
    description: "Email OTP for signup verification",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.PHONE_CHANGED]: {
    description: "Phone number changed",
    defaultChannels: ["email", "inapp"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.ROLE_CHANGED]: {
    description: "User role changed by admin",
    defaultChannels: ["inapp"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.BRANCH_CHANGED]: {
    description: "User branch assignment changed",
    defaultChannels: ["inapp"],
    audienceType: "direct_user",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.USER_DEACTIVATED]: {
    description: "User account deactivated (notify admins)",
    defaultChannels: ["inapp"],
    audienceType: "shop_admins",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.USER_REACTIVATED]: {
    description: "User account reactivated (notify admins)",
    defaultChannels: ["inapp"],
    audienceType: "shop_admins",
    priority: "normal",
  },
  // ─────────────────────────────────────────
  // BROADCAST EVENTS (Manual CAdmin Announcements)
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.BROADCAST_INAPP]: {
    description: "Manual in-app announcement from CAdmin",
    defaultChannels: ["inapp"],
    audienceType: "broadcast_filter",
    priority: "normal", // Can be overridden per broadcast
  },
  [NOTIFICATION_EVENTS.BROADCAST_EMAIL]: {
    description: "Manual email broadcast from CAdmin",
    defaultChannels: ["email"],
    audienceType: "broadcast_filter",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.BROADCAST_SMS]: {
    description: "Manual SMS broadcast from CAdmin",
    defaultChannels: ["sms"],
    audienceType: "broadcast_filter",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.BROADCAST_WHATSAPP]: {
    description: "Manual WhatsApp broadcast from CAdmin (future)",
    defaultChannels: ["whatsapp"],
    audienceType: "broadcast_filter",
    priority: "normal",
  },

  // ─────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.USER_CREATED]: {
    description: "New user created in shop",
    defaultChannels: ["inapp"],
    audienceType: "shop_admins",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.USER_INVITED]: {
    description: "User invited to shop",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "high",
  },

  // ─────────────────────────────────────────
  // SHOP & VERIFICATION
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.SHOP_VERIFIED]: {
    description: "Shop verification completed successfully",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.DOCUMENT_REJECTED]: {
    description: "One or more documents were rejected",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.DOCUMENT_PARTIALLY_REJECTED]: {
    description: "Some documents approved, some rejected",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },

  // ─────────────────────────────────────────
  // SUBSCRIPTION LIFECYCLE
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED]: {
    description: "Subscription activated successfully",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS]: {
    description: "Subscription expires in 7 days",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS]: {
    description: "Subscription expires in 3 days",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED]: {
    description: "Subscription has expired",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED]: {
    description: "Grace period has started",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING]: {
    description: "Grace period ending tomorrow",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_EXTENDED]: {
    description: "Grace period extended by admin",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED]: {
    description: "Subscription suspended due to non-payment",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED]: {
    description: "Subscription renewed successfully",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_PAYMENT_REMINDER]: {
    description: "Manual payment reminder sent by admin",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PLAN_UPGRADED]: {
    description: "Subscription plan upgraded",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PLAN_DOWNGRADED]: {
    description: "Subscription plan downgraded",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "normal",
  },

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.PAYMENT_SUCCESS]: {
    description: "Payment completed successfully",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PAYMENT_FAILED]: {
    description: "Payment attempt failed",
    defaultChannels: ["email", "inapp"],
    audienceType: "shop_owner",
    priority: "high",
  },

  // ─────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.LOW_STOCK_ALERT]: {
    description: "Inventory item below reorder level",
    defaultChannels: ["inapp"],
    audienceType: "shop_inventory_users",
    priority: "high",
    dedupEntity: "inventory",
  },
  [NOTIFICATION_EVENTS.OUT_OF_STOCK_ALERT]: {
    description: "Inventory item out of stock",
    defaultChannels: ["inapp"],
    audienceType: "shop_inventory_users",
    priority: "critical",
    dedupEntity: "inventory",
  },
  [NOTIFICATION_EVENTS.NEAR_EXPIRY_ALERT]: {
    description: "Inventory batch nearing expiry",
    defaultChannels: ["inapp"],
    audienceType: "shop_inventory_users",
    priority: "high",
    dedupEntity: "inventory",
  },
  [NOTIFICATION_EVENTS.EXPIRED_STOCK_ALERT]: {
    description: "Inventory batch has expired",
    defaultChannels: ["inapp"],
    audienceType: "shop_inventory_users",
    priority: "critical",
    dedupEntity: "inventory",
  },
  [NOTIFICATION_EVENTS.MEDICINE_LINKED]: {
    description: "Shop medicine linked to master catalog variant",
    defaultChannels: ["inapp"],
    audienceType: "shop_admins",
    priority: "normal",
    dedupEntity: "medicine",
  },
  [NOTIFICATION_EVENTS.MEDICINE_RESUBMITTED]: {
    description: "Shop resubmitted medicines for catalog review",
    defaultChannels: ["inapp"],
    audienceType: "direct_cadmin",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.MEDICINE_UNLINKED]: {
    description: "Shop medicine unlinked from master catalog",
    defaultChannels: ["inapp"],
    audienceType: "shop_admins",
    priority: "normal",
    dedupEntity: "medicine",
  },

  // ─────────────────────────────────────────
  // TICKETS
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.TICKET_CREATED]: {
    description: "Support ticket created confirmation",
    defaultChannels: ["email", "inapp"],
    audienceType: "ticket_creator",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED]: {
    description: "Ticket status updated by admin",
    defaultChannels: ["email", "inapp"],
    audienceType: "ticket_creator",
    priority: "normal",
  },

  // ─────────────────────────────────────────
  // ENQUIRIES
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.ENQUIRY_RECEIVED]: {
    description: "Enquiry confirmation sent to user",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.ENQUIRY_REPLIED]: {
    description: "Admin replied to enquiry",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "normal",
  },

  // ─────────────────────────────────────────
  // CADMIN (Email Only - No In-App)
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.CADMIN_PASSWORD_RESET_REQUESTED]: {
    description: "CAdmin requested password reset",
    defaultChannels: ["email"],
    audienceType: "direct_cadmin",
    priority: "critical",
  },
  // ─────────────────────────────────────────
  // MARKETPLACE ORDERS
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.MARKETPLACE_ORDER_PLACED]: {
    description: "New marketplace order received by pharmacy",
    defaultChannels: ["inapp"],
    audienceType: "shop_users",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.MARKETPLACE_ORDER_CANCELLED]: {
    description: "Marketplace order cancelled by customer",
    defaultChannels: ["inapp"],
    audienceType: "shop_users",
    priority: "normal",
  },

  // ─────────────────────────────────────────
  // SYSTEM BROADCAST (Email Only)
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.SYSTEM_BROADCAST]: {
    description: "System-wide announcement from admin",
    defaultChannels: ["email"],
    audienceType: "broadcast_filter",
    priority: "normal",
  },
};

export default NOTIFICATION_EVENTS;
