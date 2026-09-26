// backend/src/modules/cadmin/audit/cadminAudit.controller.js (do not remove this comment)
// ============================================
// CADMIN AUDIT CONTROLLER
// ============================================

import * as auditService from './cadminAudit.service.js';
import { success, fail } from '../../../utils/response.js';

/**
 * GET /cadmin/audit-logs
 * List audit logs with pagination and filters
 */
export async function getAuditLogs(req, res) {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
      action: req.query.action,
      entity_type: req.query.entity_type,
      actor_type: req.query.actor_type,
      actor_id: req.query.actor_id,
      shop_id: req.query.shop_id,
      branch_id: req.query.branch_id,
      entity_id: req.query.entity_id,
      reason_code: req.query.reason_code,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      search: req.query.search,
    };

    const result = await auditService.getAuditLogs(filters);

    return success(res, {
      data: result.data,
      meta: result.meta,
    }, 'Audit logs retrieved successfully');
  } catch (err) {
    console.error('[AuditController] getAuditLogs error:', err);
    return fail(res, 'Failed to fetch audit logs', 500);
  }
}

/**
 * GET /cadmin/audit-logs/stats
 * Get audit statistics
 */
export async function getAuditStats(req, res) {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      shop_id: req.query.shop_id,
    };

    const stats = await auditService.getAuditStats(filters);

    return success(res, stats, 'Audit stats retrieved successfully');
  } catch (err) {
    console.error('[AuditController] getAuditStats error:', err);
    return fail(res, 'Failed to fetch audit stats', 500);
  }
}

/**
 * GET /cadmin/audit-logs/:audit_id
 * Get single audit log detail
 */
export async function getAuditLogById(req, res) {
  try {
    const { audit_id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(audit_id)) {
      return fail(res, 'Invalid audit ID format', 400);
    }

    const log = await auditService.getAuditLogById(audit_id);

    if (!log) {
      return fail(res, 'Audit log not found', 404);
    }

    return success(res, log, 'Audit log retrieved successfully');
  } catch (err) {
    console.error('[AuditController] getAuditLogById error:', err);
    return fail(res, 'Failed to fetch audit log', 500);
  }
}

/**
 * GET /cadmin/audit-logs/export/csv
 * Export audit logs as CSV
 */
export async function exportAuditLogsCSV(req, res) {
  try {
    const filters = {
      action: req.query.action,
      entity_type: req.query.entity_type,
      actor_type: req.query.actor_type,
      shop_id: req.query.shop_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      search: req.query.search,
    };

    const logs = await auditService.getAuditLogsForExport(filters);

    // Build CSV content
    const headers = [
      'Date',
      'Time',
      'Action',
      'Actor Name',
      'Actor Type',
      'Actor Role',
      'Entity Type',
      'Entity Name',
      'Entity ID',
      'Shop',
      'Branch',
      'Reason',
      'IP Address',
      'User Agent',
      'Metadata',
    ];

    const rows = logs.map(log => {
      const date = new Date(log.created_at);
      return [
        date.toLocaleDateString('en-IN'),
        date.toLocaleTimeString('en-IN'),
        log.action,
        log.actor_name || '',
        log.actor_type || '',
        log.actor_role || '',
        log.entity_type || '',
        log.entity_name || '',
        log.entity_id || '',
        log.shop_name || '',
        log.branch_name || '',
        log.reason_code || '',
        log.ip_address || '',
        log.user_agent || '',
        log.metadata ? JSON.stringify(log.metadata) : '',
      ];
    });

    // Escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Generate filename with date
    const now = new Date();
    const filename = `audit_logs_${now.toISOString().split('T')[0]}.csv`;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.send(csvContent);
  } catch (err) {
    console.error('[AuditController] exportAuditLogsCSV error:', err);
    return fail(res, 'Failed to export audit logs', 500);
  }
}