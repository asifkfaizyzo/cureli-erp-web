// backend/src/modules/cadmin/broadcast/email/unsubscribeManagement.controller.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/unsubscribeManagement.controller.js

import { success, fail } from '../../../../utils/response.js';
import * as audit from '../../../audit/index.js';
import {
  getUnsubscribeList,
  getUnsubscribeCount,
  addToSuppressionList,
  resubscribe,
  exportUnsubscribeList,
} from './emailBroadcast.unsubscribe.js';

// ============================================
// GET UNSUBSCRIBE LIST
// ============================================

/**
 * Get unsubscribe list with pagination
 * GET /cadmin/broadcast/email/unsubscribes
 */
export async function getUnsubscribeListController(req, res) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const result = await getUnsubscribeList({
      page: Number(page),
      limit: Number(limit),
      search,
    });

    return success(res, result);
  } catch (err) {
    console.error('[Unsubscribe Management] Get list failed:', err);
    return fail(res, err.message || 'Failed to fetch unsubscribe list', err.status || 500);
  }
}

// ============================================
// GET UNSUBSCRIBE COUNT
// ============================================

/**
 * Get total unsubscribe count
 * GET /cadmin/broadcast/email/unsubscribes/count
 */
export async function getUnsubscribeCountController(req, res) {
  try {
    const count = await getUnsubscribeCount();
    return success(res, { count });
  } catch (err) {
    console.error('[Unsubscribe Management] Get count failed:', err);
    return fail(res, err.message || 'Failed to get count', err.status || 500);
  }
}

// ============================================
// ADD TO SUPPRESSION LIST
// ============================================

/**
 * Manually add email to suppression list
 * POST /cadmin/broadcast/email/unsubscribes
 */
export async function addToSuppressionListController(req, res) {
  try {
    const { email, reason } = req.body;
    const auditContext = audit.extractRequestContext(req);

    if (!email) {
      return fail(res, 'Email is required', 400);
    }

    const result = await addToSuppressionList(email, reason || 'Added by admin');

    if (!result.success) {
      return fail(res, result.message, 400);
    }

    await audit.log({
      action: audit.AuditAction.SYSTEM_CONFIG_CHANGED,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        action: 'add_to_suppression_list',
        email: email,
        reason: reason,
      },
    });

    return success(res, result, 'Email added to suppression list', 201);
  } catch (err) {
    console.error('[Unsubscribe Management] Add failed:', err);
    return fail(res, err.message || 'Failed to add to suppression list', err.status || 500);
  }
}

// ============================================
// REMOVE FROM SUPPRESSION LIST (Resubscribe)
// ============================================

/**
 * Remove email from suppression list (resubscribe)
 * DELETE /cadmin/broadcast/email/unsubscribes/:email
 */
export async function removeFromSuppressionListController(req, res) {
  try {
    const { email } = req.params;
    const auditContext = audit.extractRequestContext(req);

    if (!email) {
      return fail(res, 'Email is required', 400);
    }

    const result = await resubscribe(decodeURIComponent(email));

    if (!result.success) {
      return fail(res, result.message, 404);
    }

    await audit.log({
      action: audit.AuditAction.SYSTEM_CONFIG_CHANGED,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        action: 'remove_from_suppression_list',
        email: email,
      },
    });

    return success(res, result, 'Email removed from suppression list');
  } catch (err) {
    console.error('[Unsubscribe Management] Remove failed:', err);
    return fail(res, err.message || 'Failed to remove from suppression list', err.status || 500);
  }
}

// ============================================
// EXPORT UNSUBSCRIBE LIST
// ============================================

/**
 * Export unsubscribe list as CSV
 * GET /cadmin/broadcast/email/unsubscribes/export
 */
export async function exportUnsubscribeListController(req, res) {
  try {
    const csv = await exportUnsubscribeList();

    const filename = `unsubscribe-list-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(csv);
  } catch (err) {
    console.error('[Unsubscribe Management] Export failed:', err);
    return fail(res, err.message || 'Failed to export list', err.status || 500);
  }
}

// ============================================
// BULK ADD TO SUPPRESSION LIST
// ============================================

/**
 * Bulk add emails to suppression list
 * POST /cadmin/broadcast/email/unsubscribes/bulk
 */
export async function bulkAddToSuppressionListController(req, res) {
  try {
    const { emails, reason } = req.body;
    const auditContext = audit.extractRequestContext(req);

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return fail(res, 'Emails array is required', 400);
    }

    if (emails.length > 100) {
      return fail(res, 'Maximum 100 emails per request', 400);
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [],
    };

    for (const email of emails) {
      try {
        const result = await addToSuppressionList(email, reason || 'Bulk add by admin');
        if (result.success) {
          results.added++;
        } else {
          results.skipped++;
        }
      } catch (err) {
        results.errors.push({ email, error: err.message });
      }
    }

    await audit.log({
      action: audit.AuditAction.SYSTEM_CONFIG_CHANGED,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        action: 'bulk_add_to_suppression_list',
        total: emails.length,
        added: results.added,
        skipped: results.skipped,
        reason: reason,
      },
    });

    return success(res, results, `Added ${results.added} emails to suppression list`);
  } catch (err) {
    console.error('[Unsubscribe Management] Bulk add failed:', err);
    return fail(res, err.message || 'Failed to bulk add', err.status || 500);
  }
}

export default {
  getUnsubscribeListController,
  getUnsubscribeCountController,
  addToSuppressionListController,
  removeFromSuppressionListController,
  exportUnsubscribeListController,
  bulkAddToSuppressionListController,
};