// cadmin-web/src/api/cadminAudit.js (do not remove this comment)
// ============================================
// CADMIN AUDIT API
// ============================================

import CAdminAPI from './axios';
import { AUDIT_CATEGORIES } from '../config/modules/auditConfig';

/**
 * Fetch audit logs with filters and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.sort - Sort column (default: 'created_at')
 * @param {string} params.order - Sort order: 'asc' | 'desc' (default: 'desc')
 * @param {string} params.action - Filter by action(s), comma-separated
 * @param {string} params.category - Filter by category (expands to actions)
 * @param {string} params.entity_type - Filter by entity type
 * @param {string} params.actor_type - Filter by actor type
 * @param {string} params.actor_id - Filter by specific actor
 * @param {string} params.shop_id - Filter by shop
 * @param {string} params.date_from - Start date (ISO string)
 * @param {string} params.date_to - End date (ISO string)
 * @param {string} params.search - Search in metadata
 */
export function getAuditLogs(params = {}) {
  // If category is provided, expand to actions
  const queryParams = { ...params };
  
  if (params.category && !params.action) {
    const category = AUDIT_CATEGORIES[params.category];
    if (category) {
      queryParams.action = category.actions.join(',');
    }
    delete queryParams.category;
  }

  return CAdminAPI.get('/audits', { params: queryParams });
}

/**
 * Fetch single audit log by ID
 * 
 * @param {string} auditId - Audit log UUID
 */
export function getAuditLogById(auditId) {
  return CAdminAPI.get(`/audits/${auditId}`);
}

/**
 * Fetch audit statistics
 * 
 * @param {Object} params - Optional filters
 * @param {string} params.date_from - Start date
 * @param {string} params.date_to - End date
 * @param {string} params.shop_id - Filter by shop
 */
export function getAuditStats(params = {}) {
  return CAdminAPI.get('/audits/stats', { params });
}

/**
 * Export audit logs as CSV (current view)
 * 
 * @param {Object} params - Same filters as getAuditLogs
 * @returns {Promise<Blob>} CSV file blob
 */
export async function exportAuditLogsCSV(params = {}) {
  // If category is provided, expand to actions
  const queryParams = { ...params };
  
  if (params.category && !params.action) {
    const category = AUDIT_CATEGORIES[params.category];
    if (category) {
      queryParams.action = category.actions.join(',');
    }
    delete queryParams.category;
  }

  const response = await CAdminAPI.get('/audits/export/csv', {
    params: queryParams,
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Download CSV file to user's device
 * 
 * @param {Blob} blob - CSV blob from exportAuditLogsCSV
 * @param {string} filename - Optional custom filename
 */
export function downloadCSV(blob, filename = null) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}