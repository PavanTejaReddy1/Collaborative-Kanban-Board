import mongoose from 'mongoose'

/**
 * ActivityLog
 *
 * Append-only audit trail for all tenant-scoped actions.
 * Never update or delete records — add new ones.
 * TTL index can be added later if storage becomes a concern.
 */
const activityLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Organization',
      required: true,
      index:    true,
    },
    tenantId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Tenant',
      required: true,
      index:    true,
    },
    userId: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'User',
      required: true,
    },
    // Human-readable action string
    action: {
      type:     String,
      required: true,
      enum: [
        'board.created', 'board.updated', 'board.deleted',
        'column.created', 'column.updated', 'column.deleted', 'column.reordered',
        'task.created', 'task.updated', 'task.deleted',
        'task.moved', 'task.assigned', 'task.reordered',
        'member.invited', 'member.removed', 'member.role_changed',
      ],
    },
    entityType: {
      type: String,
      enum: ['board', 'column', 'task', 'member'],
      required: true,
    },
    entityId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Flexible payload — before/after snapshots, moved positions, etc.
    details: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    // Only createdAt — no updatedAt (logs are immutable)
    timestamps: { createdAt: true, updatedAt: false },
  },
)

// Compound index for fast tenant feed queries
activityLogSchema.index({ tenantId: 1, createdAt: -1 })
activityLogSchema.index({ entityId: 1, createdAt: -1 })

const ActivityLog = mongoose.models['ActivityLog'] || mongoose.model('ActivityLog', activityLogSchema)
export default ActivityLog
