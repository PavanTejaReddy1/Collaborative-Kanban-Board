import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useOrganization } from './OrganizationContext.jsx'
import * as orgApi from '../api/organizations.js'

/**
 * TenantContext
 *
 * Manages tenants within the active organization and the currently
 * selected tenant. The active tenant is persisted per-org so switching
 * organizations restores the correct tenant.
 *
 * Provides:
 *   tenants           – array of Tenant objects for the active org
 *   activeTenant      – the currently selected Tenant object
 *   activeTenantRole  – the user's role in the active tenant
 *   isLoadingTenants  – loading state
 *   tenantsError      – error message or null
 *   selectTenant(id)  – switch the active tenant
 *   refreshTenants()  – reload tenants from the API
 *   createTenant(data)– create a new tenant
 */

const TenantContext = createContext(null)

function tenantKey(orgId) {
  return `activeTenantId_${orgId}`
}

export function TenantProvider({ children }) {
  const { activeOrg, activeOrgRole } = useOrganization()

  const [tenants,          setTenants]          = useState([])
  const [activeTenantId,   setActiveTenantId]   = useState(null)
  const [activeTenantRole, setActiveTenantRole] = useState(null)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [tenantsError,     setTenantsError]     = useState(null)

  // ── Load tenants whenever the active org changes ───────────────────────
  const refreshTenants = useCallback(async () => {
    if (!activeOrg) {
      setTenants([])
      setActiveTenantId(null)
      setActiveTenantRole(null)
      return
    }
    setIsLoadingTenants(true)
    setTenantsError(null)
    try {
      const res = await orgApi.getOrgTenants(activeOrg._id)
      const list = res.data.data.tenants
      setTenants(list)

      if (list.length === 0) {
        setActiveTenantId(null)
        return
      }

      // Check if saved tenant ID for this org is still valid
      const saved = localStorage.getItem(tenantKey(activeOrg._id))
      const savedMatch = saved && list.find((t) => t._id === saved)

      if (savedMatch) {
        setActiveTenantId(savedMatch._id)
      } else {
        // Auto-select first tenant (covers new login, stale saves, etc.)
        const firstId = list[0]._id
        localStorage.setItem(tenantKey(activeOrg._id), firstId)
        setActiveTenantId(firstId)
      }
    } catch (err) {
      setTenantsError(err.response?.data?.message || 'Failed to load tenants.')
    } finally {
      setIsLoadingTenants(false)
    }
  }, [activeOrg])

  useEffect(() => {
    refreshTenants()
  }, [refreshTenants])

  // ── Load the user's role in the active tenant ─────────────────────────
  useEffect(() => {
    if (!activeOrg || !activeTenantId) {
      setActiveTenantRole(null)
      return
    }
    // ORG_ADMINs inherit TENANT_ADMIN everywhere — no extra call needed
    if (activeOrgRole === 'ORG_ADMIN') {
      setActiveTenantRole('ORG_ADMIN')
      return
    }
    // For other users, fetch the tenant to get their role
    orgApi.getTenant(activeOrg._id, activeTenantId)
      .then((res) => setActiveTenantRole(res.data.data.role))
      .catch(() => setActiveTenantRole(null))
  }, [activeOrg, activeTenantId, activeOrgRole])

  // ── selectTenant ──────────────────────────────────────────────────────
  const selectTenant = useCallback((tenantId) => {
    if (activeOrg) {
      localStorage.setItem(tenantKey(activeOrg._id), tenantId)
    }
    setActiveTenantId(tenantId)
  }, [activeOrg])

  // ── createTenant ──────────────────────────────────────────────────────
  const createTenant = useCallback(async (data) => {
    if (!activeOrg) throw new Error('No active organization.')
    const res = await orgApi.createTenant(activeOrg._id, data)
    const newTenant = res.data.data.tenant
    await refreshTenants()
    selectTenant(newTenant._id)
    return newTenant
  }, [activeOrg, refreshTenants, selectTenant])

  const activeTenant = tenants.find((t) => t._id === activeTenantId) || null

  const value = {
    tenants,
    activeTenant,
    activeTenantRole,
    isLoadingTenants,
    tenantsError,
    selectTenant,
    refreshTenants,
    createTenant,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider')
  return ctx
}
