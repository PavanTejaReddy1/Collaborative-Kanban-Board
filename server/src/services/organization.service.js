import Organization from '../models/Organization.js'
import Membership    from '../models/Membership.js'
import Tenant        from '../models/Tenant.js'
import { ROLES }     from '../utils/roles.js'

/**
 * Organization service.
 * All business logic lives here — controllers are thin wrappers.
 */

// ── createOrganization ────────────────────────────────────────────────────
/**
 * Creates an organization and grants ORG_ADMIN to the creator.
 * Wrapped in a try/catch at the controller level.
 */
export async function createOrganization({ name, slug, description, userId }) {
  // Check slug uniqueness
  const existing = await Organization.findOne({ slug })
  if (existing) {
    const err = new Error('An organization with this slug already exists.')
    err.status = 409
    throw err
  }

  const org = await Organization.create({ name, slug, description, createdBy: userId })

  // Grant ORG_ADMIN to the creator (org-level membership, tenantId: null)
  await Membership.create({
    userId,
    organizationId: org._id,
    tenantId:       null,
    role:           ROLES.ORG_ADMIN,
    invitedBy:      null,
  })

  return org
}

// ── getUserOrganizations ──────────────────────────────────────────────────
/**
 * Returns all organizations the user is a member of (org-level memberships).
 */
export async function getUserOrganizations(userId) {
  const memberships = await Membership.find({
    userId,
    tenantId: null,
  }).populate('organizationId')

  return memberships
    .filter((m) => m.organizationId?.isActive)
    .map((m) => ({
      organization: m.organizationId,
      role:         m.role,
      joinedAt:     m.createdAt,
    }))
}

// ── getOrganizationById ───────────────────────────────────────────────────
export async function getOrganizationById(organizationId) {
  const org = await Organization.findById(organizationId)
  if (!org || !org.isActive) {
    const err = new Error('Organization not found.')
    err.status = 404
    throw err
  }
  return org
}

// ── updateOrganization ────────────────────────────────────────────────────
export async function updateOrganization(organizationId, updates) {
  const org = await Organization.findByIdAndUpdate(
    organizationId,
    { $set: updates },
    { new: true, runValidators: true },
  )
  if (!org) {
    const err = new Error('Organization not found.')
    err.status = 404
    throw err
  }
  return org
}

// ── getOrgMembers ─────────────────────────────────────────────────────────
export async function getOrgMembers(organizationId) {
  const members = await Membership.find({
    organizationId,
    tenantId: null,
  }).populate('userId', 'name email isActive createdAt')

  return members.map((m) => ({
    user:     m.userId,
    role:     m.role,
    joinedAt: m.createdAt,
  }))
}

// ── getOrgTenants ─────────────────────────────────────────────────────────
/**
 * Returns all active tenants in an org.
 * ORG_ADMINs see all; regular members only see tenants they belong to.
 */
export async function getOrgTenants(organizationId, userId, orgRole) {
  if (orgRole === ROLES.ORG_ADMIN) {
    return Tenant.find({ organizationId, isActive: true }).sort({ createdAt: 1 })
  }

  // For non-admins, return only tenants they have membership in
  const memberships = await Membership.find({
    userId,
    organizationId,
    tenantId: { $ne: null },
  })
  const tenantIds = memberships.map((m) => m.tenantId)

  return Tenant.find({
    _id:            { $in: tenantIds },
    organizationId,
    isActive:       true,
  }).sort({ createdAt: 1 })
}
