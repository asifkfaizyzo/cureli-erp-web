// backend/src/modules/audit/audit.constants.js (do not remove this comment)
// backend/src/modules/audit/audit.constants.js

// ============================================
// AUDIT CONSTANTS
// ============================================

/**
 * Actor types — who performed the action
 */
export const ActorType = Object.freeze({
  ERP_USER: "erp_user",
  CADMIN: "cadmin",
  SYSTEM: "system",
});

export const VALID_ACTOR_TYPES = new Set(Object.values(ActorType));

/**
 * Entity types — what was affected
 * Maps to Prisma models / business entities
 */
export const EntityType = Object.freeze({
  USER: "user",
  SHOP: "shop",
  BRANCH: "branch",
  SUBSCRIPTION: "subscription",
  PLAN: "plan",
  TICKET: "ticket",
  DOCUMENT: "document",
  ENQUIRY: "enquiry",
  PAYMENT: "payment",
  CADMIN: "cadmin",
  SESSION: "session",
  SYSTEM: "system",

  //  PURCHASE ENTITIES
  PURCHASE_INVOICE: "purchase_invoice",
  PURCHASE_PAYMENT: "purchase_payment",

  //  SALES ENTITIES (ADDED)
  SALES_INVOICE: "sales_invoice",
  SALES_PAYMENT: "sales_payment",

  //  CUSTOMER ENTITY (ADDED)
  CUSTOMER: "customer",

  //  INVENTORY ENTITIES (ADDED)
  MEDICINE: "medicine",
  SUPPLIER: "supplier",
  INVENTORY: "inventory",
  STOCK_ADJUSTMENT: "stock_adjustment",
  STOCK_LEDGER: "stock_ledger",

  MASTER_MEDICINE: "master_medicine",
  MASTER_MEDICINE_VARIANT: "master_medicine_variant",
  MASTER_MEDICINE_IMAGE: "master_medicine_image",
});

export const VALID_ENTITY_TYPES = new Set(Object.values(EntityType));

/**
 * Security-critical actions
 * If audit logging fails for these, the operation MUST fail
 */
export const SECURITY_ACTIONS = new Set([
  // Authentication
  "CADMIN_LOGIN_SUCCESS",
  "CADMIN_LOGOUT",

  // Password changes
  "USER_PASSWORD_CHANGED",
  "PASSWORD_RESET_COMPLETED",
  "USER_PASSWORD_RESET_BY_ADMIN",
  "CADMIN_PASSWORD_RESET_COMPLETED",

  // Role/permission changes
  "USER_ROLE_CHANGED",
  "USER_ROLE_CHANGED_BY_ADMIN",
  "CADMIN_ROLE_CHANGED",

  // Account status changes
  "USER_ACTIVATED_BY_ADMIN",
  "USER_SUSPENDED_BY_ADMIN",
  "USER_DEACTIVATED",
  "USER_REACTIVATED",
  "CADMIN_ACTIVATED",
  "CADMIN_SUSPENDED",

  // Shop status changes
  "SHOP_SUSPENDED",
  "SHOP_ACTIVATED",
  "SHOP_SUSPENDED_DUE_TO_NON_PAYMENT",
]);

/**
 * Check if an action is security-critical
 * @param {string} action
 * @returns {boolean}
 */
export function isSecurityAction(action) {
  return SECURITY_ACTIONS.has(action);
}
