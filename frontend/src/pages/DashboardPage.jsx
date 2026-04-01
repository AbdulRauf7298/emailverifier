import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { creditsApi, verifyApi } from '../services/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280']

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const [stats, setStats] = useState({ valid: 0, invalid: 0, risky: 0, unknown: 0 })
  const [recentHistory, setRecentHistory] = useState([])
  const [credits, setCredits] = useState(user?.credits || 0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [balanceRes, historyRes] = await Promise.all([
          creditsApi.balance(),
          verifyApi.history(0, 10),
        ])
        setCredits(balanceRes.data.credits)
        setRecentHistory(historyRes.data)

        // Calculate analytics
        const counts = { valid: 0, invalid: 0, risky: 0, unknown: 0 }
        historyRes.data.forEach((item) => {
          counts[item.status] = (counts[item.status] || 0) + 1
        })
        setStats(counts)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
    refreshUser()
  }, [refreshUser])

  const pieData = [
    { name: 'Valid', value: stats.valid },
    { name: 'Invalid', value: stats.invalid },
    { name: 'Risky', value: stats.risky },
    { name: 'Unknown', value: stats.unknown },
  ].filter((d) => d.value > 0)

  const statCards = [
    { label: 'Available Credits', value: credits, icon: '💳', color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Emails Verified (Recent)', value: recentHistory.length, icon: '✉️', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Valid Emails', value: stats.valid, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Invalid / Risky', value: stats.invalid + stats.risky, icon: '⚠️', color: 'text-red-600', bg: 'bg-red-50' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading dashboard...</div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.full_name || user?.email}!</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`card ${card.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/verify" className="flex items-center gap-3 p-4 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors group">
              <span className="text-2xl">✉️</span>
              <div>
                <p className="font-medium text-primary-900">Verify Single Email</p>
                <p className="text-sm text-gray-600">Check one email instantly</p>
              </div>
            </Link>
            <Link to="/bulk" className="flex items-center gap-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <span className="text-2xl">📂</span>
              <div>
                <p className="font-medium text-green-900">Bulk Verify (CSV)</p>
                <p className="text-sm text-gray-600">Upload up to 10,000 emails</p>
              </div>
            </Link>
            <Link to="/credits" className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-medium text-yellow-900">Buy More Credits</p>
                <p className="text-sm text-gray-600">Top up via WooCommerce</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Analytics pie chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Email Status Analytics (Recent)</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-4xl mb-2">📊</span>
              <p>No data yet. Start verifying emails!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent history */}
      {recentHistory.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Verifications</h2>
            <Link to="/history" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
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
                {recentHistory.map((item) => (
                  <tr key={item.id} className="py-2">
                    <td className="py-2 pr-4 font-mono text-xs">{item.email}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{item.deliverability_score}</td>
                    <td className="py-2 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
