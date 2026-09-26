// backend/src/modules/notifications/templates/inapp/index.js (do not remove this comment)
// ============================================
// backend\src\modules\notifications\templates\inapp\index.js
// ============================================

import { NOTIFICATION_EVENTS } from "../../notification.events.js";
import { securityTemplates } from "./security.templates.js";
import { subscriptionTemplates } from "./subscription.templates.js";
import { inventoryTemplates } from "./inventory.templates.js";
import { ticketTemplates } from "./ticket.templates.js";
import { shopTemplates } from "./shop.templates.js";
import { userTemplates } from "./user.templates.js";
import { paymentTemplates } from "./payment.templates.js";
import { medicineTemplates } from "./medicine.templates.js";
import { marketplaceOrderTemplates } from "./marketplace.orders.templates.js";
// ============================================
// TEMPLATE REGISTRY
// ============================================

export const INAPP_TEMPLATES = {
  // Security & Access
  [NOTIFICATION_EVENTS.PASSWORD_CHANGED]: securityTemplates.passwordChanged,
  [NOTIFICATION_EVENTS.PASSWORD_RESET_BY_ADMIN]:
    securityTemplates.passwordResetByAdmin,
  [NOTIFICATION_EVENTS.EMAIL_CHANGED]: securityTemplates.emailChanged,
  [NOTIFICATION_EVENTS.PHONE_CHANGED]: securityTemplates.phoneChanged,
  [NOTIFICATION_EVENTS.ROLE_CHANGED]: securityTemplates.roleChanged,
  [NOTIFICATION_EVENTS.BRANCH_CHANGED]: securityTemplates.branchChanged,

  // User Management
  [NOTIFICATION_EVENTS.USER_CREATED]: userTemplates.userCreated,
  [NOTIFICATION_EVENTS.USER_DEACTIVATED]: userTemplates.userDeactivated,
  [NOTIFICATION_EVENTS.USER_REACTIVATED]: userTemplates.userReactivated,

  // Shop & Verification
  [NOTIFICATION_EVENTS.SHOP_VERIFIED]: shopTemplates.shopVerified,
  [NOTIFICATION_EVENTS.DOCUMENT_REJECTED]: shopTemplates.documentRejected,
  [NOTIFICATION_EVENTS.DOCUMENT_PARTIALLY_REJECTED]:
    shopTemplates.documentPartiallyRejected,

  // Subscription Lifecycle
  [NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED]: subscriptionTemplates.activated,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS]:
    subscriptionTemplates.expiring7Days,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS]:
    subscriptionTemplates.expiring3Days,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED]: subscriptionTemplates.expired,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED]:
    subscriptionTemplates.graceStarted,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING]:
    subscriptionTemplates.graceEnding,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_EXTENDED]:
    subscriptionTemplates.graceExtended,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED]: subscriptionTemplates.suspended,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED]: subscriptionTemplates.renewed,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_PAYMENT_REMINDER]:
    subscriptionTemplates.paymentReminder,
  [NOTIFICATION_EVENTS.PLAN_UPGRADED]: subscriptionTemplates.planUpgraded,
  [NOTIFICATION_EVENTS.PLAN_DOWNGRADED]: subscriptionTemplates.planDowngraded,

  // Payments
  [NOTIFICATION_EVENTS.PAYMENT_SUCCESS]: paymentTemplates.paymentSuccess,
  [NOTIFICATION_EVENTS.PAYMENT_FAILED]: paymentTemplates.paymentFailed,

  // Inventory
  [NOTIFICATION_EVENTS.LOW_STOCK_ALERT]: inventoryTemplates.lowStock,
  [NOTIFICATION_EVENTS.OUT_OF_STOCK_ALERT]: inventoryTemplates.outOfStock,
  [NOTIFICATION_EVENTS.NEAR_EXPIRY_ALERT]: inventoryTemplates.nearExpiry,
  [NOTIFICATION_EVENTS.EXPIRED_STOCK_ALERT]: inventoryTemplates.expiredStock,
  [NOTIFICATION_EVENTS.MEDICINE_LINKED]: medicineTemplates.medicineLinked,
  [NOTIFICATION_EVENTS.MEDICINE_UNLINKED]: medicineTemplates.medicineUnlinked,
  // Tickets
  [NOTIFICATION_EVENTS.TICKET_CREATED]: ticketTemplates.ticketCreated,
  [NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED]:
    ticketTemplates.ticketStatusChanged,
  [NOTIFICATION_EVENTS.MARKETPLACE_ORDER_PLACED]:
    marketplaceOrderTemplates.orderPlaced,

  [NOTIFICATION_EVENTS.MARKETPLACE_ORDER_CANCELLED]:
    marketplaceOrderTemplates.orderCancelled,
  // ─────────────────────────────────────────
  // BROADCAST (Pass-through - CAdmin provides title/message)
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.BROADCAST_INAPP]: (context) => ({
    title: context.title || "Announcement",
    message: context.message || "You have a new announcement.",
  }),
};

/**
 * Get in-app template for an event type
 * @param {string} eventType - Event type from NOTIFICATION_EVENTS
 * @returns {Function|null} - Template function or null
 */
export function getInAppTemplate(eventType) {
  return INAPP_TEMPLATES[eventType] || null;
}

/**
 * Generate in-app notification content
 * @param {string} eventType - Event type
 * @param {Object} context - Event context data
 * @returns {{ title: string, message: string } | null}
 */
export function generateInAppContent(eventType, context) {
  const template = getInAppTemplate(eventType);

  if (!template) {
    console.warn(`[InApp Templates] No template found for: ${eventType}`);
    return null;
  }

  try {
    return template(context);
  } catch (error) {
    console.error(
      `[InApp Templates] Error generating content for ${eventType}:`,
      error,
    );
    return {
      title: "Notification",
      message: "You have a new notification.",
    };
  }
}

export default {
  INAPP_TEMPLATES,
  getInAppTemplate,
  generateInAppContent,
};
