import mongoose from 'mongoose'

/**
 * Organization
 *
 * Top of the hierarchy: Organization → Tenants → Boards → Columns → Tasks
 *
 * Every piece of business data is ultimately owned by an organization.
 * Cross-organization access is impossible by design — all queries include
 * an organizationId filter derived from the authenticated user's membership,
 * never from the client request body.
 */
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Organization name is required'],
      trim:      true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    slug: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
      trim:     true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
    },
    description: {
      type:     String,
      trim:     true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default:  '',
    },
    // The user who created this organization. They are automatically given
    // the ORG_ADMIN role in the Membership collection.
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

// Compound index for common lookup patterns
organizationSchema.index({ slug: 1 })
organizationSchema.index({ createdBy: 1 })

const Organization = mongoose.model('Organization', organizationSchema)
export default Organization
