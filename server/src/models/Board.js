import mongoose from 'mongoose'

const boardSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Board title is required'],
      trim:      true,
      minlength: [1,   'Title cannot be empty'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type:     String,
      trim:     true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default:  '',
    },
    // Both IDs are required for strict tenant isolation.
    // Every query scopes on BOTH fields.
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
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    isArchived: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

boardSchema.index({ tenantId: 1, organizationId: 1, isArchived: 1 })
boardSchema.index({ createdBy: 1 })

const Board = mongoose.models['Board'] || mongoose.model('Board', boardSchema)
export default Board
