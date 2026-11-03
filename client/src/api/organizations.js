import api from './index.js'

// ── Organizations ─────────────────────────────────────────────────────────
export const createOrganization = (data)       => api.post('/organizations', data)
export const getMyOrganizations = ()           => api.get('/organizations')
export const getOrganization    = (orgId)      => api.get(`/organizations/${orgId}`)
export const updateOrganization = (orgId, data)=> api.patch(`/organizations/${orgId}`, data)
export const getOrgMembers      = (orgId)      => api.get(`/organizations/${orgId}/members`)
export const getOrgTenants      = (orgId)      => api.get(`/organizations/${orgId}/tenants`)

// ── Tenants ───────────────────────────────────────────────────────────────
export const createTenant   = (orgId, data)         => api.post(`/organizations/${orgId}/tenants`, data)
export const getTenant      = (orgId, tenantId)     => api.get(`/organizations/${orgId}/tenants/${tenantId}`)
export const updateTenant   = (orgId, tenantId, d)  => api.patch(`/organizations/${orgId}/tenants/${tenantId}`, d)
export const deleteTenant   = (orgId, tenantId)     => api.delete(`/organizations/${orgId}/tenants/${tenantId}`)

// ── Tenant Members ────────────────────────────────────────────────────────
export const getTenantMembers   = (orgId, tenantId)           => api.get(`/organizations/${orgId}/tenants/${tenantId}/members`)
export const inviteMember       = (orgId, tenantId, data)     => api.post(`/organizations/${orgId}/tenants/${tenantId}/members`, data)
export const removeMember       = (orgId, tenantId, membId)   => api.delete(`/organizations/${orgId}/tenants/${tenantId}/members/${membId}`)
export const updateMemberRole   = (orgId, tenantId, membId, role) => api.patch(`/organizations/${orgId}/tenants/${tenantId}/members/${membId}`, { role })
