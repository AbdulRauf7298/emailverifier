import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/verify', label: 'Verify Email', icon: '✉️' },
  { to: '/bulk', label: 'Bulk Verify', icon: '📂' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/credits', label: 'Credits', icon: '💳' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col`}>
        <div className="p-6 border-b border-primary-700">
          <h1 className="text-xl font-bold">✉️ EmailVerifier</h1>
          <p className="text-primary-300 text-sm mt-1">SaaS Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {user?.is_superadmin && (
            <NavLink
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-700 text-white'
                    : 'text-red-300 hover:bg-red-800 hover:text-white'
                }`
              }
            >
              <span>🔐</span>
              Superadmin
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-primary-700">
          <div className="text-xs text-primary-300 mb-3">
            <p className="font-medium text-white truncate">{user?.email}</p>
            <p className="mt-1">💳 {user?.credits} credits</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-primary-300 hover:text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            ☰
          </button>
          <h1 className="font-bold text-primary-600">EmailVerifier</h1>
          <div className="text-sm text-gray-500">💳 {user?.credits}</div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
