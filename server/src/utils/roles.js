/**
 * Role constants — extracted to a standalone module to avoid circular imports.
 *
 * Import from here in:
 *   - models/Membership.js  (enum validation)
 *   - middleware/authorize.js (re-exported for consumers)
 *   - services/*             (role comparisons)
 *   - controllers/*          (role assignment)
 */
export const ROLES = Object.freeze({
  ORG_ADMIN:    'ORG_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  MEMBER:       'MEMBER',
})
