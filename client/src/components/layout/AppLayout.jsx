import Sidebar from './Sidebar.jsx'

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      {/* offset matches sidebar width w-60 = 15rem */}
      <main className="flex-1 ml-60 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
