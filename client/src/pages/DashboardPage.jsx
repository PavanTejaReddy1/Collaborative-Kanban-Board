import { useNavigate } from 'react-router-dom'
import { useAuth }         from '../contexts/AuthContext.jsx'
import { useOrganization } from '../contexts/OrganizationContext.jsx'
import { useTenant }       from '../contexts/TenantContext.jsx'
import { Button } from '../components/ui/Button.jsx'

/**
 * DashboardPage
 *
 * Shows the current user, org, and tenant context.
 * Prompts users with no org to create one.
 * Will be replaced by the Kanban board UI in Phase 4.
 */
export default function DashboardPage() {
  const { user, logout }                           = useAuth()
  const { organizations, activeOrg, activeOrgRole,
          selectOrg, isLoadingOrgs }               = useOrganization()
  const { tenants, activeTenant, activeTenantRole,
          selectTenant, isLoadingTenants }          = useTenant()
  const navigate                                   = useNavigate()

  const handleLogout = async () => { await logout() }

  // ── No organization yet ───────────────────────────────────────────────
  if (!isLoadingOrgs && organizations.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
          <p className="text-gray-500 text-sm mb-6">
            You don&apos;t belong to any organization yet. Create one to get started.
          </p>
          <Button className="w-full" size="lg" onClick={() => navigate('/organizations/new')}>
            Create organization
          </Button>
          <button onClick={handleLogout} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Collaborative Kanban</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Organization Selector ──────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Organization</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/organizations/new')}>
              + New
            </Button>
          </div>
          {isLoadingOrgs ? (
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {organizations.map(({ organization, role }) => (
                <button
                  key={organization._id}
                  onClick={() => selectOrg(organization._id)}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                    activeOrg?._id === organization._id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400',
                  ].join(' ')}
                >
                  {organization.name}
                  <span className="ml-2 text-xs opacity-70">{role}</span>
                </button>
              ))}
            </div>
          )}

          {activeOrg && (
            <p className="mt-3 text-xs text-gray-400">
              Active: <span className="font-medium text-gray-600">{activeOrg.name}</span>
              {' '}· Slug: <code className="bg-gray-100 px-1 rounded">{activeOrg.slug}</code>
              {' '}· Role: <span className="font-medium">{activeOrgRole}</span>
            </p>
          )}
        </section>

        {/* ── Tenant (Branch) Selector ───────────────────────────────────── */}
        {activeOrg && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Branches in {activeOrg.name}</h2>
              {['ORG_ADMIN'].includes(activeOrgRole) && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/tenants/new')}>
                  + New branch
                </Button>
              )}
            </div>

            {isLoadingTenants ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : tenants.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                No branches yet.
                {activeOrgRole === 'ORG_ADMIN' && (
                  <button
                    onClick={() => navigate('/tenants/new')}
                    className="ml-2 text-primary-600 hover:underline font-medium"
                  >
                    Create the first one.
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tenants.map((tenant) => (
                  <button
                    key={tenant._id}
                    onClick={() => selectTenant(tenant._id)}
                    className={[
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                      activeTenant?._id === tenant._id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400',
                    ].join(' ')}
                  >
                    {tenant.name}
                  </button>
                ))}
              </div>
            )}

            {activeTenant && (
              <p className="mt-3 text-xs text-gray-400">
                Active branch: <span className="font-medium text-gray-600">{activeTenant.name}</span>
                {' '}· Role: <span className="font-medium">{activeTenantRole}</span>
              </p>
            )}
          </section>
        )}

        {/* ── Phase status banner ────────────────────────────────────────── */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
          <strong>Phase 3 complete.</strong> Organization isolation, tenant management, and RBAC are working.
          Board creation and the Kanban UI will be added in Phase 4.
        </div>

      </main>
    </div>
  )
}
