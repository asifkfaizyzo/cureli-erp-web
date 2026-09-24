// backend/src/modules/cadmin/broadcast/email/emailBroadcast.types.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/emailBroadcast.types.js

/**
 * Campaign Status Flow
 * 
 * draft → scheduled → sending → sent
 *                  ↘         ↗
 *                   → paused →
 *                  ↘         ↘
 *                   → failed   → partial_failure
 *                  ↘
 *                   → cancelled
 * 
 * Status Descriptions:
 * - draft: Being edited, not scheduled
 * - scheduled: Waiting for scheduled time
 * - sending: Currently being processed
 * - paused: Stopped due to daily quota exhaustion, will resume tomorrow
 * - sent: All emails sent successfully
 * - partial_failure: Some emails failed, some succeeded
 * - failed: All emails failed or critical error occurred
 * - cancelled: Manually cancelled by admin
 */

export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  PAUSED: 'paused',
  SENT: 'sent',
  PARTIAL_FAILURE: 'partial_failure',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Status Transitions
 */
export const ALLOWED_TRANSITIONS = {
  draft: ['scheduled', 'sending', 'cancelled'],
  scheduled: ['sending', 'paused', 'cancelled'],
  sending: ['sent', 'partial_failure', 'failed', 'paused'],
  paused: ['sending', 'cancelled'],
  sent: [], // Terminal state
  partial_failure: ['sending'], // Can retry
  failed: ['sending'], // Can retry
  cancelled: [], // Terminal state
};

/**
 * Which statuses can be edited
 */
export const EDITABLE_STATUSES = [
  CAMPAIGN_STATUS.DRAFT,
  CAMPAIGN_STATUS.SCHEDULED,
];

/**
 * Which statuses can be cancelled
 */
export const CANCELLABLE_STATUSES = [
  CAMPAIGN_STATUS.SCHEDULED,
  CAMPAIGN_STATUS.PAUSED,
];

/**
 * Which statuses can be retried
 */
export const RETRYABLE_STATUSES = [
  CAMPAIGN_STATUS.PAUSED,
  CAMPAIGN_STATUS.FAILED,
  CAMPAIGN_STATUS.PARTIAL_FAILURE,
];

/**
 * Terminal statuses (no further action possible)
 */
export const TERMINAL_STATUSES = [
  CAMPAIGN_STATUS.SENT,
  CAMPAIGN_STATUS.CANCELLED,
];

export default {
  CAMPAIGN_STATUS,
  ALLOWED_TRANSITIONS,
  EDITABLE_STATUSES,
  CANCELLABLE_STATUSES,
  RETRYABLE_STATUSES,
  TERMINAL_STATUSES,
};