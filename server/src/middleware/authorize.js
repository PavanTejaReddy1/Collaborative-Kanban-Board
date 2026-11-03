import mongoose from 'mongoose'
import Membership from '../models/Membership.js'
import { ROLES } from '../utils/roles.js'

/**
 * Role constants — re-exported here so route files only need one import.
 */
export { ROLES }

// ── resolveOrg ────────────────────────────────────────────────────────────
/**
 * resolveOrg
 *
 * Reads :organizationId from req.params, verifies that req.user is a
 * member of that organization, and attaches:
 *   req.organizationId   – the verified ObjectId
 *   req.orgMembership    – the org-level Membership document
 *   req.orgRole          – the user's role at org level (ORG_ADMIN or MEMBER)
 *
 * Must run after authenticate().
 * Any route that operates within an organization must use this middleware.
 */
export async function resolveOrg(req, res, next) {
  try {
    const { organizationId } = req.params

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid organization ID.' })
    }

    // Look up the user's org-level membership (tenantId: null)
    const membership = await Membership.findOne({
      userId:         req.user._id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      tenantId:       null,
    })

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this organization.',
      })
    }

    req.organizationId = membership.organizationId
    req.orgMembership  = membership
    req.orgRole        = membership.role

    next()
  } catch (err) {
    next(err)
  }
}

// ── resolveTenant ─────────────────────────────────────────────────────────
/**
 * resolveTenant
 *
 * Reads :tenantId from req.params, verifies membership, and attaches:
 *   req.tenantId         – the verified ObjectId
 *   req.tenantMembership – the tenant-level Membership document
 *   req.membershipRole   – the user's effective role in this tenant
 *                          (ORG_ADMINs inherit TENANT_ADMIN privileges)
 *
 * Must run after resolveOrg().
 */
export async function resolveTenant(req, res, next) {
  try {
    const { tenantId } = req.params

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant ID.' })
    }

    const tenantObjId = new mongoose.Types.ObjectId(tenantId)

    // ORG_ADMINs have implicit TENANT_ADMIN access to all tenants in their org
    if (req.orgRole === ROLES.ORG_ADMIN) {
      req.tenantId       = tenantObjId
      req.membershipRole = ROLES.ORG_ADMIN // keep ORG_ADMIN so requireRole checks work
      return next()
    }

    // Everyone else must have an explicit tenant-level membership
    const membership = await Membership.findOne({
      userId:         req.user._id,
      organizationId: req.organizationId,
      tenantId:       tenantObjId,
    })

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this tenant.',
      })
    }

    req.tenantId         = tenantObjId
    req.tenantMembership = membership
    req.membershipRole   = membership.role

    next()
  } catch (err) {
    next(err)
  }
}

// ── requireRole ───────────────────────────────────────────────────────────
/**
 * requireRole(...allowedRoles)
 *
 * Must run after resolveOrg() and/or resolveTenant().
 * Checks req.membershipRole (tenant level) or req.orgRole (org level).
 *
 * Usage:
 *   router.delete('/:id', authenticate, resolveOrg, resolveTenant,
 *     requireRole(ROLES.ORG_ADMIN, ROLES.TENANT_ADMIN), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' })
    }

    // Use the most specific role available
    const role = req.membershipRole || req.orgRole

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      })
    }

    next()
  }
}
