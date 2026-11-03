import mongoose from 'mongoose'

const columnSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Column title is required'],
      trim:      true,
      minlength: [1,   'Title cannot be empty'],
      maxlength: [80,  'Title must be at most 80 characters'],
    },
    boardId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Board',
      required: true,
    },
    organizationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Organization',
      required: true,
    },
    tenantId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Tenant',
      required: true,
    },
    // Integer position for ordering; gap-based (0, 1000, 2000…)
    // allows inserting between columns without rewriting all positions
    position: {
      type:    Number,
      required: true,
      default:  0,
    },
    color: {
      type:    String,
      default: '#6366f1', // indigo-500
      match:   [/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color'],
    },
  },
  { timestamps: true },
)

// Ordered columns for a board
columnSchema.index({ boardId: 1, position: 1 })
// Tenant-scoped lookups
columnSchema.index({ tenantId: 1, boardId: 1 })

const Column = mongoose.models['Column'] || mongoose.model('Column', columnSchema)
export default Column
