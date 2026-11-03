import * as tenantService from '../services/tenant.service.js'
import {
  validate,
  createTenantSchema,
  updateTenantSchema,
  inviteMemberSchema,
} from '../utils/validation.js'

// ── POST /api/organizations/:organizationId/tenants ───────────────────────
export async function createTenant(req, res, next) {
  try {
    const { value, error } = validate(createTenantSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const tenant = await tenantService.createTenant({
      ...value,
      organizationId: req.organizationId,
      userId:         req.user._id,
    })

    return res.status(201).json({ success: true, data: { tenant } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── GET /api/organizations/:organizationId/tenants/:tenantId ──────────────
export async function getTenant(req, res, next) {
  try {
    const tenant = await tenantService.getTenantById(req.tenantId, req.organizationId)
    return res.status(200).json({
      success: true,
      data: {
        tenant,
        role: req.membershipRole,
      },
    })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── PATCH /api/organizations/:organizationId/tenants/:tenantId ────────────
export async function updateTenant(req, res, next) {
  try {
    const { value, error } = validate(updateTenantSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const tenant = await tenantService.updateTenant(req.tenantId, req.organizationId, value)
    return res.status(200).json({ success: true, data: { tenant } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── DELETE /api/organizations/:organizationId/tenants/:tenantId ───────────
export async function deleteTenant(req, res, next) {
  try {
    await tenantService.deleteTenant(req.tenantId, req.organizationId)
    return res.status(200).json({ success: true, message: 'Tenant deactivated successfully.' })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── GET /api/organizations/:organizationId/tenants/:tenantId/members ──────
export async function getTenantMembers(req, res, next) {
  try {
    const members = await tenantService.getTenantMembers(req.tenantId, req.organizationId)
    return res.status(200).json({ success: true, data: { members } })
  } catch (err) { next(err) }
}

// ── POST /api/organizations/:organizationId/tenants/:tenantId/members ─────
export async function inviteMember(req, res, next) {
  try {
    const { value, error } = validate(inviteMemberSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const result = await tenantService.inviteMember({
      ...value,
      tenantId:       req.tenantId,
      organizationId: req.organizationId,
      invitedBy:      req.user._id,
    })

    return res.status(201).json({ success: true, data: result })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── DELETE /api/.../members/:membershipId ─────────────────────────────────
export async function removeMember(req, res, next) {
  try {
    await tenantService.removeMember(req.params.membershipId, req.organizationId, req.tenantId)
    return res.status(200).json({ success: true, message: 'Member removed.' })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── PATCH /api/.../members/:membershipId ──────────────────────────────────
export async function updateMemberRole(req, res, next) {
  try {
    const { role } = req.body
    if (!['TENANT_ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be TENANT_ADMIN or MEMBER.' })
    }

    const membership = await tenantService.updateMemberRole(
      req.params.membershipId,
      req.organizationId,
      req.tenantId,
      role,
    )
    return res.status(200).json({ success: true, data: { membership } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}
