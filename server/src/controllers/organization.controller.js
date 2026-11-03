import * as orgService from '../services/organization.service.js'
import { validate, createOrganizationSchema, updateOrganizationSchema } from '../utils/validation.js'

// ── POST /api/organizations ───────────────────────────────────────────────
export async function createOrganization(req, res, next) {
  try {
    const { value, error } = validate(createOrganizationSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const org = await orgService.createOrganization({
      ...value,
      userId: req.user._id,
    })

    return res.status(201).json({ success: true, data: { organization: org } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── GET /api/organizations ────────────────────────────────────────────────
export async function getMyOrganizations(req, res, next) {
  try {
    const orgs = await orgService.getUserOrganizations(req.user._id)
    return res.status(200).json({ success: true, data: { organizations: orgs } })
  } catch (err) { next(err) }
}

// ── GET /api/organizations/:organizationId ────────────────────────────────
export async function getOrganization(req, res, next) {
  try {
    const org = await orgService.getOrganizationById(req.organizationId)
    return res.status(200).json({
      success: true,
      data: {
        organization: org,
        role:         req.orgRole,
      },
    })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── PATCH /api/organizations/:organizationId ──────────────────────────────
export async function updateOrganization(req, res, next) {
  try {
    const { value, error } = validate(updateOrganizationSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const org = await orgService.updateOrganization(req.organizationId, value)
    return res.status(200).json({ success: true, data: { organization: org } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

// ── GET /api/organizations/:organizationId/members ────────────────────────
export async function getOrgMembers(req, res, next) {
  try {
    const members = await orgService.getOrgMembers(req.organizationId)
    return res.status(200).json({ success: true, data: { members } })
  } catch (err) { next(err) }
}

// ── GET /api/organizations/:organizationId/tenants ────────────────────────
export async function getOrgTenants(req, res, next) {
  try {
    const tenants = await orgService.getOrgTenants(req.organizationId, req.user._id, req.orgRole)
    return res.status(200).json({ success: true, data: { tenants } })
  } catch (err) { next(err) }
}
