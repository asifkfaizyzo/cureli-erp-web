// backend/src/modules/notifications/templates/email/index.js

import { shopVerifiedTemplate } from "./shopVerified.js";
import { documentRejectedTemplate } from "./documentRejected.js";
import { ticketCreatedTemplate } from "./ticketCreated.js";
import { ticketStatusChangedTemplate } from "./ticketStatusChanged.js";
import { passwordResetTemplate } from "./passwordReset.js";
import { cadminPasswordResetTemplate } from "./cadminPasswordReset.js";
import { subscriptionActivatedTemplate } from "./subscriptionActivated.js";
import { subscriptionExpiringTemplate } from "./subscriptionExpiring.js";
import { subscriptionGraceStartedTemplate } from "./subscriptionGraceStarted.js";
import { subscriptionGraceEndingTemplate } from "./subscriptionGraceEnding.js";
import { subscriptionGraceExtendedTemplate } from "./subscriptionGraceExtended.js";
import { subscriptionSuspendedTemplate } from "./subscriptionSuspended.js";
import { subscriptionRenewedTemplate } from "./subscriptionRenewed.js";
import { subscriptionPaymentReminderTemplate } from "./subscriptionPaymentReminder.js";
import { paymentSuccessTemplate } from "./paymentSuccess.js";
import { paymentFailedTemplate } from "./paymentFailed.js";
import { systemBroadcastTemplate } from "./systemBroadcast.js";
import { enquiryReceivedTemplate } from "./enquiryReceived.js";
import { enquiryRepliedTemplate } from "./enquiryReplied.js";
import { emailVerificationOtpTemplate } from "./emailVerificationOtp.js";
import { emailChangeOtpTemplate } from "./emailChangeOtp.js";
import { emailChangedTemplate } from "./emailChanged.js";
import { passwordChangedTemplate } from "./passwordChanged.js";
import { phoneChangedTemplate } from "./phoneChanged.js";
import { NOTIFICATION_EVENTS } from "../../notification.events.js";
export { returnApprovalToSupplier } from "./returnApprovalToSupplier.js";
import { marketplaceOrderBilledTemplate } from "./marketplaceOrderBilled.js";
import { mobileWelcomeTemplate } from "./mobileWelcome.js";

export const EMAIL_TEMPLATES = {
  // Account Security
  [NOTIFICATION_EVENTS.EMAIL_VERIFICATION_OTP]: emailVerificationOtpTemplate,
  [NOTIFICATION_EVENTS.EMAIL_CHANGE_OTP]: emailChangeOtpTemplate,
  [NOTIFICATION_EVENTS.EMAIL_CHANGED]: emailChangedTemplate,
  [NOTIFICATION_EVENTS.PASSWORD_CHANGED]: passwordChangedTemplate,
  [NOTIFICATION_EVENTS.PHONE_CHANGED]: phoneChangedTemplate,

  // Shop Verification
  [NOTIFICATION_EVENTS.SHOP_VERIFIED]: shopVerifiedTemplate,
  [NOTIFICATION_EVENTS.DOCUMENT_REJECTED]: documentRejectedTemplate,
  [NOTIFICATION_EVENTS.DOCUMENT_PARTIALLY_REJECTED]: documentRejectedTemplate,

  // Tickets
  [NOTIFICATION_EVENTS.TICKET_CREATED]: ticketCreatedTemplate,
  [NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED]: ticketStatusChangedTemplate,

  // Password Reset
  [NOTIFICATION_EVENTS.PASSWORD_RESET_REQUESTED]: passwordResetTemplate,
  [NOTIFICATION_EVENTS.CADMIN_PASSWORD_RESET_REQUESTED]:
    cadminPasswordResetTemplate,

  // Subscriptions
  [NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED]: subscriptionActivatedTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS]:
    subscriptionExpiringTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS]:
    subscriptionExpiringTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED]: subscriptionExpiringTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED]:
    subscriptionGraceStartedTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING]:
    subscriptionGraceEndingTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_EXTENDED]:
    subscriptionGraceExtendedTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED]: subscriptionSuspendedTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED]: subscriptionRenewedTemplate,
  [NOTIFICATION_EVENTS.SUBSCRIPTION_PAYMENT_REMINDER]:
    subscriptionPaymentReminderTemplate,

  // Payments
  [NOTIFICATION_EVENTS.PAYMENT_SUCCESS]: paymentSuccessTemplate,
  [NOTIFICATION_EVENTS.PAYMENT_FAILED]: paymentFailedTemplate,

  // Broadcast
  [NOTIFICATION_EVENTS.SYSTEM_BROADCAST]: systemBroadcastTemplate,

  // Enquiries
  [NOTIFICATION_EVENTS.ENQUIRY_RECEIVED]: enquiryReceivedTemplate,
  [NOTIFICATION_EVENTS.ENQUIRY_REPLIED]: enquiryRepliedTemplate,

  // Registered Marketplace Order Billed Template
  [NOTIFICATION_EVENTS.MARKETPLACE_ORDER_BILLED]:
    marketplaceOrderBilledTemplate,
  [NOTIFICATION_EVENTS.MOBILE_USER_WELCOME]: mobileWelcomeTemplate,
};

export function getEmailTemplate(eventType) {
  return EMAIL_TEMPLATES[eventType] || null;
}

export default EMAIL_TEMPLATES;
