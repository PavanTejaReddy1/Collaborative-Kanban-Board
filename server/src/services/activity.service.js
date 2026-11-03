import ActivityLog from '../models/ActivityLog.js'

/**
 * Logs an activity. Never throws — failures are swallowed so
 * they don't break the main operation.
 */
export async function log({ organizationId, tenantId, userId, action, entityType, entityId, details = {} }) {
  try {
    await ActivityLog.create({ organizationId, tenantId, userId, action, entityType, entityId, details })
  } catch (err) {
    console.error('ActivityLog write failed:', err.message)
  }
}

/**
 * Get recent activity feed for a tenant (most recent first).
 */
export async function getTenantActivity(tenantId, organizationId, { limit = 50, entityId = null } = {}) {
  const filter = { tenantId, organizationId }
  if (entityId) filter.entityId = entityId

  return ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean()
}
