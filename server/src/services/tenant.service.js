import Tenant     from '../models/Tenant.js'
import Membership from '../models/Membership.js'
import User       from '../models/User.js'
import { ROLES }  from '../utils/roles.js'

/**
 * Tenant service.
 * All tenant operations are scoped to organizationId — passed explicitly
 * from the verified middleware context, never from the client body.
 */

// ── createTenant ──────────────────────────────────────────────────────────
export async function createTenant({ name, slug, description, organizationId, userId }) {
  // Slug must be unique within the organization
  const existing = await Tenant.findOne({ organizationId, slug })
  if (existing) {
    const err = new Error('A tenant with this slug already exists in the organization.')
    err.status = 409
    throw err
  }

  const tenant = await Tenant.create({
    name,
    slug,
    description,
    organizationId,
    createdBy: userId,
  })

  // Grant TENANT_ADMIN to the creator (unless they are already ORG_ADMIN,
  // but we create the membership anyway for explicitness and auditability)
  await Membership.create({
    userId,
    organizationId,
    tenantId:  tenant._id,
    role:      ROLES.TENANT_ADMIN,
    invitedBy: null,
  })

  return tenant
}

// ── getTenantById ─────────────────────────────────────────────────────────
/**
 * Always scoped to organizationId to prevent cross-org access.
 */
export async function getTenantById(tenantId, organizationId) {
  const tenant = await Tenant.findOne({ _id: tenantId, organizationId, isActive: true })
  if (!tenant) {
    const err = new Error('Tenant not found.')
    err.status = 404
    throw err
  }
  return tenant
}

// ── updateTenant ──────────────────────────────────────────────────────────
export async function updateTenant(tenantId, organizationId, updates) {
  const tenant = await Tenant.findOneAndUpdate(
    { _id: tenantId, organizationId },
    { $set: updates },
    { new: true, runValidators: true },
  )
  if (!tenant) {
    const err = new Error('Tenant not found.')
    err.status = 404
    throw err
  }
  return tenant
}

// ── deleteTenant (soft delete) ────────────────────────────────────────────
export async function deleteTenant(tenantId, organizationId) {
  const tenant = await Tenant.findOneAndUpdate(
    { _id: tenantId, organizationId },
    { $set: { isActive: false } },
    { new: true },
  )
  if (!tenant) {
    const err = new Error('Tenant not found.')
    err.status = 404
    throw err
  }
  return tenant
}

// ── getTenantMembers ──────────────────────────────────────────────────────
export async function getTenantMembers(tenantId, organizationId) {
  const members = await Membership.find({
    organizationId,
    tenantId,
  }).populate('userId', 'name email isActive createdAt')

  return members.map((m) => ({
    user:      m.userId,
    role:      m.role,
    joinedAt:  m.createdAt,
    membershipId: m._id,
  }))
}

// ── inviteMember ──────────────────────────────────────────────────────────
/**
 * Adds an existing user to a tenant by email.
 * The user must already have an account (registration is separate).
 * They also receive an org-level membership if they don't already have one.
 */
export async function inviteMember({ email, role, tenantId, organizationId, invitedBy }) {
  // 1. Find the user
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
  if (!user) {
    const err = new Error('No active user found with that email address.')
    err.status = 404
    throw err
  }

  // 2. Ensure the user has an org-level membership (needed for resolveOrg)
  await Membership.findOneAndUpdate(
    { userId: user._id, organizationId, tenantId: null },
    { $setOnInsert: { userId: user._id, organizationId, tenantId: null, role: ROLES.MEMBER, invitedBy } },
    { upsert: true, new: true },
  )

  // 3. Create or update the tenant-level membership
  const existing = await Membership.findOne({ userId: user._id, organizationId, tenantId })
  if (existing) {
    const err = new Error('This user is already a member of the tenant.')
    err.status = 409
    throw err
  }

  const membership = await Membership.create({
    userId: user._id,
    organizationId,
    tenantId,
    role,
    invitedBy,
  })

  return { user: user.toPublicJSON(), role: membership.role }
}

// ── removeMember ─────────────────────────────────────────────────────────
export async function removeMember(membershipId, organizationId, tenantId) {
  const membership = await Membership.findOneAndDelete({
    _id:            membershipId,
    organizationId,
    tenantId,
  })
  if (!membership) {
    const err = new Error('Membership not found.')
    err.status = 404
    throw err
  }
  return membership
}

// ── updateMemberRole ─────────────────────────────────────────────────────
export async function updateMemberRole(membershipId, organizationId, tenantId, role) {
  const membership = await Membership.findOneAndUpdate(
    { _id: membershipId, organizationId, tenantId },
    { $set: { role } },
    { new: true, runValidators: true },
  )
  if (!membership) {
    const err = new Error('Membership not found.')
    err.status = 404
    throw err
  }
  return membership
}
