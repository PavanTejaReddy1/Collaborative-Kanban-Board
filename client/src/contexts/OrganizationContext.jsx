import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'
import * as orgApi from '../api/organizations.js'

/**
 * OrganizationContext
 *
 * Manages the user's list of organizations and the currently active one.
 * The active organization is persisted to localStorage so it survives
 * page refreshes.
 *
 * Provides:
 *   organizations      – array of { organization, role, joinedAt }
 *   activeOrg          – the currently selected organization object
 *   activeOrgRole      – the user's role in the active org
 *   isLoadingOrgs      – loading state
 *   orgsError          – error message or null
 *   selectOrg(orgId)   – switch the active organization
 *   refreshOrgs()      – reload organizations from the API
 *   createOrg(data)    – create a new organization
 */

const OrganizationContext = createContext(null)

const ACTIVE_ORG_KEY = 'activeOrgId'

export function OrganizationProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [organizations, setOrganizations] = useState([])
  const [activeOrgId,   setActiveOrgId]   = useState(() => localStorage.getItem(ACTIVE_ORG_KEY))
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)
  const [orgsError,     setOrgsError]     = useState(null)

  // ── Load orgs when user authenticates ─────────────────────────────────
  const refreshOrgs = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoadingOrgs(true)
    setOrgsError(null)
    try {
      const res = await orgApi.getMyOrganizations()
      const list = res.data.data.organizations
      setOrganizations(list)

      // Auto-select the first org if no active org is saved
      if (list.length > 0 && !localStorage.getItem(ACTIVE_ORG_KEY)) {
        const firstId = list[0].organization._id
        localStorage.setItem(ACTIVE_ORG_KEY, firstId)
        setActiveOrgId(firstId)
      }
    } catch (err) {
      setOrgsError(err.response?.data?.message || 'Failed to load organizations.')
    } finally {
      setIsLoadingOrgs(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      refreshOrgs()
    } else {
      setOrganizations([])
      setActiveOrgId(null)
    }
  }, [isAuthenticated, refreshOrgs])

  // ── selectOrg ─────────────────────────────────────────────────────────
  const selectOrg = useCallback((orgId) => {
    localStorage.setItem(ACTIVE_ORG_KEY, orgId)
    setActiveOrgId(orgId)
  }, [])

  // ── createOrg ─────────────────────────────────────────────────────────
  const createOrg = useCallback(async (data) => {
    const res = await orgApi.createOrganization(data)
    const newOrg = res.data.data.organization
    await refreshOrgs()
    selectOrg(newOrg._id)
    return newOrg
  }, [refreshOrgs, selectOrg])

  // ── Derived values ─────────────────────────────────────────────────────
  const activeMembership = organizations.find(
    (m) => m.organization._id === activeOrgId,
  )

  const value = {
    organizations,
    activeOrg:     activeMembership?.organization || null,
    activeOrgRole: activeMembership?.role || null,
    isLoadingOrgs,
    orgsError,
    selectOrg,
    refreshOrgs,
    createOrg,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext)
  if (!ctx) throw new Error('useOrganization must be used within an OrganizationProvider')
  return ctx
}
