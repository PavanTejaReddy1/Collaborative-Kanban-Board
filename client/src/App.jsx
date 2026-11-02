import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

/**
 * App is the root router shell.
 * Pages will be added progressively as features are implemented.
 * For now it renders a health-check placeholder to confirm
 * Vite + React + Tailwind + Router are all wired correctly.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HealthCheck />} />
        {/* Future routes will be added here */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function HealthCheck() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
          {/* Kanban icon */}
          <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Collaborative Kanban Board
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Frontend infrastructure is up and running.
          Authentication and feature modules will be added progressively.
        </p>
        <div className="flex flex-col gap-2 text-left text-xs">
          <StatusRow label="React + Vite"       ok />
          <StatusRow label="Tailwind CSS v3"    ok />
          <StatusRow label="React Router v6"    ok />
          <StatusRow label="@dnd-kit"           ok />
          <StatusRow label="Socket.IO Client"   ok />
          <StatusRow label="Axios"              ok />
          <StatusRow label="Backend API"        pending />
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, ok, pending }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
        ok      ? 'bg-green-500' :
        pending ? 'bg-yellow-400' :
                  'bg-red-500'
      }`} />
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="ml-auto text-gray-400">
        {ok ? 'ready' : pending ? 'pending' : 'error'}
      </span>
    </div>
  )
}

export default App
