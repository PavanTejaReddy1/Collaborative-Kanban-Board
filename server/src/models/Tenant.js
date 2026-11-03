import mongoose from 'mongoose'

/**
 * Tenant  (also called "Branch" in the UI)
 *
 * Tenants partition an Organization into isolated workspaces.
 * A user can be a member of multiple tenants within the same org,
 * each with a different role.
 *
 * Strict isolation rule: every Tenant query MUST include { organizationId }
 * so data can never leak across organizations.
 */
const tenantSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Tenant name is required'],
      trim:      true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    slug: {
      type:     String,
      required: true,
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
    organizationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Organization',
      required: true,
      index:    true,
    },
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

// slug is unique within an organization (two orgs can share slug names)
tenantSchema.index({ organizationId: 1, slug: 1 }, { unique: true })
tenantSchema.index({ organizationId: 1, isActive: 1 })

const Tenant = mongoose.models['Tenant'] || mongoose.model('Tenant', tenantSchema)
export default Tenant
