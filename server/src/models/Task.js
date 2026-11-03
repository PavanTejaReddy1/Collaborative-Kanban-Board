import mongoose from 'mongoose'

export const PRIORITIES = Object.freeze({
  LOW:    'LOW',
  MEDIUM: 'MEDIUM',
  HIGH:   'HIGH',
  URGENT: 'URGENT',
})

const taskSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Task title is required'],
      trim:      true,
      minlength: [1,   'Title cannot be empty'],
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    description: {
      type:     String,
      trim:     true,
      maxlength: [5000, 'Description must be at most 5000 characters'],
      default:  '',
    },
    boardId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Board',
      required: true,
    },
    columnId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Column',
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
    assignedTo: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    priority: {
      type:    String,
      enum:    Object.values(PRIORITIES),
      default: PRIORITIES.MEDIUM,
    },
    dueDate: {
      type:    Date,
      default: null,
    },
    // Position within column (gap-based: 0, 1000, 2000…)
    position: {
      type:    Number,
      required: true,
      default:  0,
    },
    // Optimistic concurrency control.
    // Client must send back the version it last saw.
    // Server increments on every successful update.
    version: {
      type:    Number,
      default: 1,
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    labels: [{
      type: String,
      trim: true,
      maxlength: 40,
    }],
  },
  { timestamps: true },
)

// Fast task-list queries
taskSchema.index({ columnId: 1, position: 1 })
taskSchema.index({ boardId: 1, tenantId: 1 })
taskSchema.index({ tenantId: 1, assignedTo: 1 })

const Task = mongoose.models['Task'] || mongoose.model('Task', taskSchema)
export default Task
