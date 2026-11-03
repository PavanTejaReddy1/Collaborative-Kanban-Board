import mongoose from 'mongoose'
import { ROLES } from '../utils/roles.js'

/**
 * Membership
 *
 * Join table that records which users belong to which organizations
 * and tenants, and what role they hold.
 *
 * Two membership types are represented in one collection:
 *
 *   1. Organization-level membership  →  tenantId is null
 *      Roles: ORG_ADMIN
 *      Gives access to manage the org itself (create/delete tenants, invite users)
 *
 *   2. Tenant-level membership  →  tenantId is populated
 *      Roles: TENANT_ADMIN | MEMBER
 *      Controls what the user can do within a specific tenant's boards/tasks
 *
 * This design lets a user be an ORG_ADMIN (org-level) AND a MEMBER (tenant-level)
 * simultaneously, which reflects real-world org hierarchies.
 *
 * Security invariant:
 *   ALL authorization middleware reads the role from THIS collection.
 *   No route may grant access based on client-supplied role claims.
 */
const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    organizationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Organization',
      required: true,
    },
    // null = org-level membership; ObjectId = tenant-level membership
    tenantId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Tenant',
      default: null,
    },
    role: {
      type:     String,
      enum:     Object.values(ROLES),
      required: true,
    },
    invitedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
  },
  { timestamps: true },
)

// ── Indexes ────────────────────────────────────────────────────────────────

// Fast lookup: "what is this user's role in this org?"
membershipSchema.index({ userId: 1, organizationId: 1, tenantId: 1 })

// Fast lookup: "all members of this tenant"
membershipSchema.index({ organizationId: 1, tenantId: 1 })

// Prevent duplicate memberships at the same scope
membershipSchema.index(
  { userId: 1, organizationId: 1, tenantId: 1 },
  { unique: true },
)

const Membership = mongoose.models['Membership'] || mongoose.model('Membership', membershipSchema)
export default Membership
