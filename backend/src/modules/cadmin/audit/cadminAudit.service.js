// backend/src/modules/cadmin/audit/cadminAudit.service.js (do not remove this comment)
// ============================================
// CADMIN AUDIT SERVICE
// ============================================

import prisma from '../../../config/prisma.js';

/**
 * Build where clause from filters
 */
function buildWhereClause(filters) {
  const where = {};

  // Action filter (single or comma-separated)
  if (filters.action) {
    const actions = filters.action.split(',').map(a => a.trim());
    where.action = actions.length === 1 ? actions[0] : { in: actions };
  }

  // Entity type filter
  if (filters.entity_type) {
    where.entity_type = filters.entity_type;
  }

  // Actor type filter
  if (filters.actor_type) {
    where.actor_type = filters.actor_type;
  }

  // Actor ID filter
  if (filters.actor_id) {
    where.actor_id = filters.actor_id;
  }

  // Shop ID filter
  if (filters.shop_id) {
    where.shop_id = filters.shop_id;
  }

  // Branch ID filter
  if (filters.branch_id) {
    where.branch_id = filters.branch_id;
  }

  // Entity ID filter
  if (filters.entity_id) {
    where.entity_id = filters.entity_id;
  }

  // Reason code filter
  if (filters.reason_code) {
    where.reason_code = filters.reason_code;
  }

  // Date range filter
  if (filters.date_from || filters.date_to) {
    where.created_at = {};
    if (filters.date_from) {
      where.created_at.gte = new Date(filters.date_from);
    }
    if (filters.date_to) {
      // Set to end of day
      const endDate = new Date(filters.date_to);
      endDate.setHours(23, 59, 59, 999);
      where.created_at.lte = endDate;
    }
  }

  // Search in metadata (PostgreSQL JSONB)
  if (filters.search) {
    const searchTerm = filters.search.trim();
    where.OR = [
      { action: { contains: searchTerm, mode: 'insensitive' } },
      { actor_role: { contains: searchTerm, mode: 'insensitive' } },
      { reason_code: { contains: searchTerm, mode: 'insensitive' } },
      { ip_address: { contains: searchTerm, mode: 'insensitive' } },
      // Search in metadata JSON - PostgreSQL specific
      {
        metadata: {
          path: [],
          string_contains: searchTerm,
        },
      },
    ];
  }

  return where;
}

/**
 * Get paginated audit logs with filters
 */
export async function getAuditLogs(filters = {}) {
  const {
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'desc',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = buildWhereClause(filters);

  // Valid sort columns
  const validSortColumns = ['created_at', 'action', 'entity_type', 'actor_type'];
  const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  // Execute query with count
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { [sortColumn]: sortOrder },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Enrich logs with actor/entity names
  const enrichedLogs = await enrichAuditLogs(logs);

  return {
    data: enrichedLogs,
    meta: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

/**
 * Get single audit log by ID
 */
export async function getAuditLogById(auditId) {
  const log = await prisma.auditLog.findUnique({
    where: { audit_id: auditId },
  });

  if (!log) {
    return null;
  }

  // Enrich with full details
  const [enriched] = await enrichAuditLogs([log]);
  return enriched;
}

/**
 * Get audit statistics
 */
export async function getAuditStats(filters = {}) {
  const where = buildWhereClause(filters);

  // Get total count
  const total = await prisma.auditLog.count({ where });

  // Get today's count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayCount = await prisma.auditLog.count({
    where: {
      ...where,
      created_at: { gte: todayStart },
    },
  });

  // Get counts by actor type
  const actorTypeCounts = await prisma.auditLog.groupBy({
    by: ['actor_type'],
    where,
    _count: { actor_type: true },
  });

  // Get counts by entity type (top 5)
  const entityTypeCounts = await prisma.auditLog.groupBy({
    by: ['entity_type'],
    where,
    _count: { entity_type: true },
    orderBy: { _count: { entity_type: 'desc' } },
    take: 5,
  });

  return {
    total,
    today: todayCount,
    by_actor_type: actorTypeCounts.reduce((acc, item) => {
      acc[item.actor_type] = item._count.actor_type;
      return acc;
    }, {}),
    by_entity_type: entityTypeCounts.reduce((acc, item) => {
      acc[item.entity_type] = item._count.entity_type;
      return acc;
    }, {}),
  };
}

/**
 * Get all audit logs for CSV export (no pagination, with filters)
 */
export async function getAuditLogsForExport(filters = {}) {
  const where = buildWhereClause(filters);

  // Limit to 10000 for safety
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 10000,
  });

  // Enrich with names
  const enrichedLogs = await enrichAuditLogs(logs);
  return enrichedLogs;
}

/**
 * Enrich audit logs with actor and entity names
 */
async function enrichAuditLogs(logs) {
  if (!logs.length) return [];

  // Collect unique IDs for batch lookup
  const userIds = new Set();
  const cadminIds = new Set();
  const shopIds = new Set();
  const branchIds = new Set();

  logs.forEach(log => {
    if (log.actor_type === 'erp_user' && log.actor_id) userIds.add(log.actor_id);
    if (log.actor_type === 'cadmin' && log.actor_id) cadminIds.add(log.actor_id);
    if (log.shop_id) shopIds.add(log.shop_id);
    if (log.branch_id) branchIds.add(log.branch_id);

    // Entity lookups
    if (log.entity_type === 'user' && log.entity_id) userIds.add(log.entity_id);
    if (log.entity_type === 'cadmin' && log.entity_id) cadminIds.add(log.entity_id);
    if (log.entity_type === 'shop' && log.entity_id) shopIds.add(log.entity_id);
    if (log.entity_type === 'branch' && log.entity_id) branchIds.add(log.entity_id);
  });

  // Batch fetch
  const [users, cadmins, shops, branches] = await Promise.all([
    userIds.size > 0
      ? prisma.user.findMany({
          where: { user_id: { in: Array.from(userIds) } },
          select: { user_id: true, full_name: true, username: true, email: true },
        })
      : [],
    cadminIds.size > 0
      ? prisma.cAdmin.findMany({
          where: { cadmin_id: { in: Array.from(cadminIds) } },
          select: { cadmin_id: true, name: true, username: true, email: true },
        })
      : [],
    shopIds.size > 0
      ? prisma.shop.findMany({
          where: { shop_id: { in: Array.from(shopIds) } },
          select: { shop_id: true, business_name: true },
        })
      : [],
    branchIds.size > 0
      ? prisma.branch.findMany({
          where: { branch_id: { in: Array.from(branchIds) } },
          select: { branch_id: true, branch_name: true },
        })
      : [],
  ]);

  // Create lookup maps
  const userMap = new Map(users.map(u => [u.user_id, u]));
  const cadminMap = new Map(cadmins.map(c => [c.cadmin_id, c]));
  const shopMap = new Map(shops.map(s => [s.shop_id, s]));
  const branchMap = new Map(branches.map(b => [b.branch_id, b]));

  // Enrich each log
  return logs.map(log => {
    const enriched = { ...log };

    // Actor info
    if (log.actor_type === 'erp_user' && log.actor_id) {
      const user = userMap.get(log.actor_id);
      enriched.actor_name = user?.full_name || user?.username || 'Unknown User';
      enriched.actor_email = user?.email;
    } else if (log.actor_type === 'cadmin' && log.actor_id) {
      const admin = cadminMap.get(log.actor_id);
      enriched.actor_name = admin?.name || admin?.username || 'Unknown Admin';
      enriched.actor_email = admin?.email;
    } else if (log.actor_type === 'system') {
      enriched.actor_name = 'System';
    }

    // Entity info
    if (log.entity_type === 'user' && log.entity_id) {
      const user = userMap.get(log.entity_id);
      enriched.entity_name = user?.full_name || user?.username || log.entity_id;
    } else if (log.entity_type === 'cadmin' && log.entity_id) {
      const admin = cadminMap.get(log.entity_id);
      enriched.entity_name = admin?.name || admin?.username || log.entity_id;
    } else if (log.entity_type === 'shop' && log.entity_id) {
      const shop = shopMap.get(log.entity_id);
      enriched.entity_name = shop?.business_name || log.entity_id;
    } else if (log.entity_type === 'branch' && log.entity_id) {
      const branch = branchMap.get(log.entity_id);
      enriched.entity_name = branch?.branch_name || log.entity_id;
    } else {
      enriched.entity_name = log.entity_id || 'N/A';
    }

    // Shop/Branch context
    if (log.shop_id) {
      const shop = shopMap.get(log.shop_id);
      enriched.shop_name = shop?.business_name || log.shop_id;
    }
    if (log.branch_id) {
      const branch = branchMap.get(log.branch_id);
      enriched.branch_name = branch?.branch_name || log.branch_id;
    }

    return enriched;
  });
}