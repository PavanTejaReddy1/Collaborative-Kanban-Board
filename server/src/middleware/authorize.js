/**
 * Role constants.
 *
 * These are the three roles used across the application.
 * They apply at the MEMBERSHIP level (org/tenant), not at the
 * User document level. The Membership model (Phase 3) will store
 * which role a user holds within a specific organisation or tenant.
 *
 * Exported here so they can be imported consistently by any middleware,
 * controller, or service without magic strings.
 */
export const ROLES = Object.freeze({
  ORG_ADMIN:    'ORG_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  MEMBER:       'MEMBER',
})

/**
 * requireRole(...allowedRoles)
 *
 * Factory that returns an Express middleware enforcing that
 * req.user holds one of the specified roles within the current context.
 *
 * Usage:
 *   router.delete('/boards/:id', authenticate, requireRole(ROLES.ORG_ADMIN, ROLES.TENANT_ADMIN), handler)
 *
 * NOTE: In Phase 3, this middleware will be expanded to look up the
 * user's membership role for the organization/tenant derived from the
 * request params. For now it exposes the interface without the DB lookup
 * so routes can already declare their role requirements.
 *
 * @param  {...string} allowedRoles
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // authenticate() must run before this middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
    }

    // Phase 3 will resolve the contextual role from the Membership model.
    // The resolved role will be attached to req.membershipRole by a separate
    // tenant-scoping middleware. Guard against it being missing here.
    const userRole = req.membershipRole

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      })
    }

    next()
  }
}
