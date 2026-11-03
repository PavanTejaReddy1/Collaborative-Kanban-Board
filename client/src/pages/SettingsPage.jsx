import { useState } from 'react'
import { Settings } from 'lucide-react'
import AppLayout  from '../components/layout/AppLayout.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Alert }  from '../components/ui/Alert.jsx'
import { useOrganization } from '../contexts/OrganizationContext.jsx'
import { useTenant }       from '../contexts/TenantContext.jsx'
import * as orgApi from '../api/organizations.js'

export default function SettingsPage() {
  const { activeOrg, activeOrgRole, refreshOrgs } = useOrganization()
  const { activeTenant, activeTenantRole, refreshTenants } = useTenant()

  const [orgName, setOrgName]     = useState(activeOrg?.name || '')
  const [orgDesc, setOrgDesc]     = useState(activeOrg?.description || '')
  const [tenName, setTenName]     = useState(activeTenant?.name || '')
  const [tenDesc, setTenDesc]     = useState(activeTenant?.description || '')
  const [saving,  setSaving]      = useState(false)
  const [success, setSuccess]     = useState('')
  const [error,   setError]       = useState('')

  const canEditOrg    = activeOrgRole    === 'ORG_ADMIN'
  const canEditTenant = ['ORG_ADMIN','TENANT_ADMIN'].includes(activeTenantRole || activeOrgRole)

  const handleSaveOrg = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await orgApi.updateOrganization(activeOrg._id, { name: orgName, description: orgDesc })
      await refreshOrgs()
      setSuccess('Organization updated.')
    } catch (err) { setError(err.response?.data?.message || 'Failed to update organization') }
    finally { setSaving(false) }
  }

  const handleSaveTenant = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await orgApi.updateTenant(activeOrg._id, activeTenant._id, { name: tenName, description: tenDesc })
      await refreshTenants()
      setSuccess('Branch updated.')
    } catch (err) { setError(err.response?.data?.message || 'Failed to update branch') }
    finally { setSaving(false) }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage organization and branch settings</p>
        </div>

        <Alert message={success} type="success" className="mb-4" />
        <Alert message={error}   type="error"   className="mb-4" />

        {/* Organization settings */}
        {activeOrg && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" /> Organization
            </h2>
            <form onSubmit={handleSaveOrg} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                <input
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  disabled={!canEditOrg}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <textarea
                  value={orgDesc}
                  onChange={e => setOrgDesc(e.target.value)}
                  disabled={!canEditOrg}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              {canEditOrg && (
                <Button type="submit" isLoading={saving}>Save organization</Button>
              )}
            </form>
          </section>
        )}

        {/* Branch settings */}
        {activeTenant && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" /> Branch — {activeTenant.name}
            </h2>
            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                <input
                  value={tenName}
                  onChange={e => setTenName(e.target.value)}
                  disabled={!canEditTenant}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <textarea
                  value={tenDesc}
                  onChange={e => setTenDesc(e.target.value)}
                  disabled={!canEditTenant}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              {canEditTenant && (
                <Button type="submit" isLoading={saving}>Save branch</Button>
              )}
            </form>
          </section>
        )}
      </div>
    </AppLayout>
  )
}
