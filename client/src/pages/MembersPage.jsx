import { useEffect, useState } from 'react'
import { Users, UserPlus, Trash2, Shield } from 'lucide-react'
import AppLayout   from '../components/layout/AppLayout.jsx'
import { Button }  from '../components/ui/Button.jsx'
import { Alert }   from '../components/ui/Alert.jsx'
import { useOrganization } from '../contexts/OrganizationContext.jsx'
import { useTenant }       from '../contexts/TenantContext.jsx'
import * as orgApi from '../api/organizations.js'

const ROLE_BADGE = {
  ORG_ADMIN:    'bg-purple-100 text-purple-700',
  TENANT_ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER:       'bg-gray-100 text-gray-600',
}

export default function MembersPage() {
  const { activeOrg, activeOrgRole } = useOrganization()
  const { activeTenant, activeTenantRole } = useTenant()
  const [members,   setMembers]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [showInvite,setShowInvite]= useState(false)
  const [invEmail,  setInvEmail]  = useState('')
  const [invRole,   setInvRole]   = useState('MEMBER')
  const [inviting,  setInviting]  = useState(false)
  const [invError,  setInvError]  = useState('')

  const canManage = ['ORG_ADMIN','TENANT_ADMIN'].includes(activeTenantRole || activeOrgRole)

  const loadMembers = async () => {
    if (!activeOrg || !activeTenant) return
    setLoading(true); setError('')
    try {
      const res = await orgApi.getTenantMembers(activeOrg._id, activeTenant._id)
      setMembers(res.data.data.members)
    } catch (e) { setError('Failed to load members') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadMembers() }, [activeOrg, activeTenant]) // eslint-disable-line

  const handleInvite = async (e) => {
    e.preventDefault(); setInvError('')
    if (!invEmail.trim()) return
    setInviting(true)
    try {
      await orgApi.inviteMember(activeOrg._id, activeTenant._id, { email: invEmail.trim(), role: invRole })
      setShowInvite(false); setInvEmail(''); setInvRole('MEMBER')
      loadMembers()
    } catch (err) {
      setInvError(err.response?.data?.message || 'Failed to invite member')
    } finally { setInviting(false) }
  }

  const handleRemove = async (membershipId) => {
    if (!confirm('Remove this member?')) return
    try {
      await orgApi.removeMember(activeOrg._id, activeTenant._id, membershipId)
      loadMembers()
    } catch (err) { alert(err.response?.data?.message || 'Failed to remove member') }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-500 mt-1">{activeTenant?.name}</p>
          </div>
          {canManage && (
            <Button onClick={() => setShowInvite(true)}>
              <UserPlus className="w-4 h-4" /> Invite member
            </Button>
          )}
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading members…</div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No members yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                  {canManage && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map(({ user, role, joinedAt, membershipId }) => (
                  <tr key={membershipId || user?._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[role] || ROLE_BADGE.MEMBER}`}>
                        <Shield className="w-3 h-3" /> {role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400 hidden sm:table-cell">
                      {joinedAt ? new Date(joinedAt).toLocaleDateString() : '—'}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleRemove(membershipId)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Invite modal */}
        {showInvite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Invite to {activeTenant?.name}</h2>
              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <Alert message={invError} type="error" />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email address</label>
                  <input
                    type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
                    placeholder="colleague@example.com" autoFocus
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
                  <select value={invRole} onChange={e => setInvRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="TENANT_ADMIN">Tenant Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" isLoading={inviting}>Send invite</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
