import React, { useEffect, useState } from 'react'
import { adminApi } from '../services/api'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [verifications, setVerifications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [creditModal, setCreditModal] = useState(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [adjustMsg, setAdjustMsg] = useState('')

  useEffect(() => {
    adminApi.stats().then((res) => setStats(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'users') {
      setLoading(true)
      adminApi.users().then((res) => { setUsers(res.data); setLoading(false) }).catch(() => setLoading(false))
    } else if (activeTab === 'verifications') {
      setLoading(true)
      adminApi.allVerifications().then((res) => { setVerifications(res.data); setLoading(false) }).catch(() => setLoading(false))
    }
  }, [activeTab])

  const handleAdjustCredits = async () => {
    if (!creditModal || !creditAmount) return
    try {
      await adminApi.adjustCredits(creditModal.id, parseInt(creditAmount), creditReason)
      setAdjustMsg(`✅ Credits adjusted successfully`)
      const res = await adminApi.users()
      setUsers(res.data)
      setTimeout(() => { setCreditModal(null); setAdjustMsg(''); setCreditAmount(''); setCreditReason('') }, 1500)
    } catch (err) {
      setAdjustMsg(`❌ ${err.response?.data?.detail || 'Failed'}`)
    }
  }

  const handleToggleUser = async (userId, currentActive) => {
    await adminApi.toggleActive(userId, !currentActive)
    const res = await adminApi.users()
    setUsers(res.data)
  }

  const tabs = ['users', 'verifications', 'stats']

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔐</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Superadmin Dashboard</h1>
          <p className="text-gray-500 mt-0.5">Manage users, credits, and verification logs</p>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total_users, icon: '👥' },
            { label: 'Verifications', value: stats.total_verifications, icon: '✉️' },
            { label: 'Credits Outstanding', value: stats.total_credits_outstanding, icon: '💳' },
            { label: 'Bulk Jobs', value: stats.total_bulk_jobs, icon: '📂' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card text-center">
              <span className="text-2xl">{icon}</span>
              <p className="text-2xl font-bold mt-1">{value?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="card">
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Credits</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 pr-4 font-mono text-xs">{u.email}</td>
                      <td className="py-3 pr-4">{u.full_name || '—'}</td>
                      <td className="py-3 pr-4 font-bold">{u.credits}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${u.is_superadmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                          {u.is_superadmin ? 'Superadmin' : 'User'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCreditModal(u)}
                            className="text-xs btn-secondary py-1 px-2"
                          >
                            💳 Credits
                          </button>
                          <button
                            onClick={() => handleToggleUser(u.id, u.is_active)}
                            className="text-xs btn-secondary py-1 px-2"
                          >
                            {u.is_active ? '🔒 Disable' : '🔓 Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Verifications tab */}
      {activeTab === 'verifications' && (
        <div className="card">
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Score</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {verifications.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2 pr-4 font-mono text-xs">{v.email}</td>
                      <td className="py-2 pr-4">
                        <span className={`badge-${v.status}`}>{v.status}</span>
                      </td>
                      <td className="py-2 pr-4">{v.deliverability_score}</td>
                      <td className="py-2 text-gray-500 text-xs">{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && stats && (
        <div className="card">
          <h2 className="font-semibold mb-4">Platform Statistics</h2>
          <dl className="grid grid-cols-2 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-2xl font-bold mt-1">{value?.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Credit adjustment modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-1">Adjust Credits</h2>
            <p className="text-gray-500 text-sm mb-4">{creditModal.email} — Current: {creditModal.credits}</p>

            {adjustMsg && (
              <div className="mb-3 text-sm text-center">{adjustMsg}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (positive = add, negative = deduct)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="e.g. 100 or -50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Manual adjustment"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleAdjustCredits} className="btn-primary flex-1">
                Apply
              </button>
              <button
                onClick={() => { setCreditModal(null); setCreditAmount(''); setCreditReason(''); setAdjustMsg('') }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
