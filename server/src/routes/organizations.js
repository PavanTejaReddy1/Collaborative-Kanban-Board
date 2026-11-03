import { Router } from 'express'
import { authenticate }  from '../middleware/authenticate.js'
import { resolveOrg, resolveTenant, requireRole, ROLES } from '../middleware/authorize.js'
import * as orgCtrl    from '../controllers/organization.controller.js'
import * as tenantCtrl from '../controllers/tenant.controller.js'

const router = Router()

/**
 * Organization routes
 *
 * All routes require authentication.
 * Routes that operate on a specific org also require resolveOrg()
 * which verifies the user is a member before any data is returned.
 */

// ── /api/organizations ────────────────────────────────────────────────────
router.post  ('/',    authenticate, orgCtrl.createOrganization)
router.get   ('/',    authenticate, orgCtrl.getMyOrganizations)

// ── /api/organizations/:organizationId ────────────────────────────────────
router.get   ('/:organizationId',         authenticate, resolveOrg, orgCtrl.getOrganization)
router.patch ('/:organizationId',         authenticate, resolveOrg, requireRole(ROLES.ORG_ADMIN), orgCtrl.updateOrganization)

// ── /api/organizations/:organizationId/members ────────────────────────────
router.get   ('/:organizationId/members', authenticate, resolveOrg, orgCtrl.getOrgMembers)

// ── /api/organizations/:organizationId/tenants ────────────────────────────
router.get   ('/:organizationId/tenants', authenticate, resolveOrg, orgCtrl.getOrgTenants)

// Tenant CRUD — nested under organization for strict scoping
router.post  ('/:organizationId/tenants',              authenticate, resolveOrg, requireRole(ROLES.ORG_ADMIN), tenantCtrl.createTenant)
router.get   ('/:organizationId/tenants/:tenantId',    authenticate, resolveOrg, resolveTenant, tenantCtrl.getTenant)
router.patch ('/:organizationId/tenants/:tenantId',    authenticate, resolveOrg, resolveTenant, requireRole(ROLES.ORG_ADMIN, ROLES.TENANT_ADMIN), tenantCtrl.updateTenant)
router.delete('/:organizationId/tenants/:tenantId',    authenticate, resolveOrg, requireRole(ROLES.ORG_ADMIN), tenantCtrl.deleteTenant)

// Member management within a tenant
router.get   ('/:organizationId/tenants/:tenantId/members',              authenticate, resolveOrg, resolveTenant, tenantCtrl.getTenantMembers)
router.post  ('/:organizationId/tenants/:tenantId/members',              authenticate, resolveOrg, resolveTenant, requireRole(ROLES.ORG_ADMIN, ROLES.TENANT_ADMIN), tenantCtrl.inviteMember)
router.delete('/:organizationId/tenants/:tenantId/members/:membershipId',authenticate, resolveOrg, resolveTenant, requireRole(ROLES.ORG_ADMIN, ROLES.TENANT_ADMIN), tenantCtrl.removeMember)
router.patch ('/:organizationId/tenants/:tenantId/members/:membershipId',authenticate, resolveOrg, resolveTenant, requireRole(ROLES.ORG_ADMIN, ROLES.TENANT_ADMIN), tenantCtrl.updateMemberRole)

export default router
