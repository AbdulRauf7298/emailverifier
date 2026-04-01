import React, { useState } from 'react'
import { verifyApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import ScoreBar from '../components/ScoreBar'

export default function SingleVerifyPage() {
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await verifyApi.single(email)
      setResult(res.data)
      await refreshUser()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 402) {
        setError('Insufficient credits. Please buy more credits.')
      } else {
        setError(detail || 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const checks = result ? [
    { label: 'Syntax Valid', value: result.is_valid_syntax, type: 'bool' },
    { label: 'MX Records', value: result.has_mx_records, type: 'bool' },
    { label: 'SMTP Valid', value: result.is_smtp_valid, type: 'bool' },
    { label: 'Disposable', value: result.is_disposable, type: 'bool-bad' },
    { label: 'Role-based', value: result.is_role_based, type: 'bool-bad' },
    { label: 'Catch-all', value: result.is_catch_all, type: 'bool-neutral' },
  ] : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verify Single Email</h1>
        <p className="text-gray-500 mt-1">Check an email address instantly. Costs 1 credit.</p>
      </div>

      <div className="card">
        <form onSubmit={handleVerify} className="flex gap-3">
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            disabled={loading}
          />
          <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading}>
            {loading ? '⏳ Checking...' : '🔍 Verify'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold font-mono">{result.email}</p>
              {result.suggested_correction && (
                <p className="text-sm text-yellow-600 mt-1">
                  💡 Did you mean: <strong>{result.suggested_correction}</strong>?
                </p>
              )}
            </div>
            <StatusBadge status={result.status} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Deliverability Score</p>
            <ScoreBar score={result.deliverability_score} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {checks.map(({ label, value, type }) => {
              const isNull = value === null || value === undefined
              let icon = isNull ? '❓' : value ? '✅' : '❌'
              let textColor = isNull ? 'text-gray-400' : value ? 'text-green-700' : 'text-red-700'

              if (type === 'bool-bad') {
                icon = isNull ? '❓' : value ? '⚠️' : '✅'
                textColor = isNull ? 'text-gray-400' : value ? 'text-yellow-700' : 'text-green-700'
              }
              if (type === 'bool-neutral') {
                icon = isNull ? '❓' : value ? '⚠️' : '✅'
                textColor = 'text-gray-600'
              }

              return (
                <div key={label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span>{icon}</span>
                  <span className={`text-sm font-medium ${textColor}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
