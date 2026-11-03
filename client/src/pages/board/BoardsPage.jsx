import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Kanban, Plus, Trash2, ArrowRight } from 'lucide-react'
import AppLayout  from '../../components/layout/AppLayout.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useOrganization } from '../../contexts/OrganizationContext.jsx'
import { useTenant }       from '../../contexts/TenantContext.jsx'
import { useBoard }        from '../../contexts/BoardContext.jsx'

export default function BoardsPage() {
  const { activeOrg }    = useOrganization()
  const { activeTenant } = useTenant()
  const { boards, loadBoards, createBoard, deleteBoard, isLoading } = useBoard()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })

  useEffect(() => {
    if (activeOrg && activeTenant) loadBoards()
  }, [activeOrg, activeTenant, loadBoards])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const board = await createBoard(form)
      setShowModal(false)
      setForm({ title: '', description: '' })
      navigate(`/boards/${board._id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create board')
    } finally { setCreating(false) }
  }

  const handleDelete = async (e, boardId) => {
    e.stopPropagation()
    if (!confirm('Archive this board? All tasks will be preserved.')) return
    setDeletingId(boardId)
    try { await deleteBoard(boardId) }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete board') }
    finally { setDeletingId(null) }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
            <p className="text-gray-500 mt-1">{activeTenant?.name || 'Select a branch'}</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> New board
          </Button>
        </div>

        {/* Board grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <Kanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No boards yet</h2>
            <p className="text-gray-400 mb-6 text-sm">Create your first board to start organizing your work</p>
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Create first board</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map(board => (
              <div
                key={board._id}
                onClick={() => navigate(`/boards/${board._id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Kanban className="w-5 h-5 text-primary-600" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, board._id)}
                    disabled={deletingId === board._id}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{board.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                  {board.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>By {board.createdBy?.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create board modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Create new board</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Sprint 24 Board"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What is this board for?"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" isLoading={creating}>Create board</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
