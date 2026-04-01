import React, { useEffect, useState } from 'react'
import { verifyApi } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import ScoreBar from '../components/ScoreBar'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await verifyApi.history(page * limit, limit)
        setHistory(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification History</h1>
        <p className="text-gray-500 mt-1">All your past email verifications</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>No verifications yet. Start by verifying an email!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4 w-32">Score</th>
                    <th className="pb-3 pr-4">MX</th>
                    <th className="pb-3 pr-4">SMTP</th>
                    <th className="pb-3 pr-4">Disposable</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-mono text-xs">{item.email}</td>
                      <td className="py-3 pr-4"><StatusBadge status={item.status} /></td>
                      <td className="py-3 pr-4 w-32"><ScoreBar score={item.deliverability_score} /></td>
                      <td className="py-3 pr-4">{item.has_mx_records === null ? '❓' : item.has_mx_records ? '✅' : '❌'}</td>
                      <td className="py-3 pr-4">{item.is_smtp_valid === null ? '❓' : item.is_smtp_valid ? '✅' : '❌'}</td>
                      <td className="py-3 pr-4">{item.is_disposable ? '⚠️' : '✅'}</td>
                      <td className="py-3 text-gray-500 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={history.length < limit}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
