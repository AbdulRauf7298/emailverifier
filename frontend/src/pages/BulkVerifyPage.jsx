import React, { useState, useCallback } from 'react'
import { verifyApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'

export default function BulkVerifyPage() {
  const { user, refreshUser } = useAuth()
  const [file, setFile] = useState(null)
  const [job, setJob] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) {
      setFile(dropped)
    } else {
      setError('Please drop a CSV file')
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setError('')
    setJob(null)
    setResults([])
    setLoading(true)

    try {
      const res = await verifyApi.bulkUpload(file)
      const newJob = res.data
      setJob(newJob)
      setLoading(false)
      setPolling(true)
      pollJob(newJob.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
      setLoading(false)
    }
  }

  const pollJob = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await verifyApi.bulkStatus(jobId)
        setJob(res.data)
        if (['completed', 'failed'].includes(res.data.status)) {
          clearInterval(interval)
          setPolling(false)
          if (res.data.status === 'completed') {
            const resultsRes = await verifyApi.bulkResults(jobId, 0, 100)
            setResults(resultsRes.data)
            await refreshUser()
          }
        }
      } catch {
        clearInterval(interval)
        setPolling(false)
      }
    }, 2000)
  }

  const progressPct = job?.total_emails
    ? Math.round((job.processed_emails / job.total_emails) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Email Verification</h1>
        <p className="text-gray-500 mt-1">
          Upload a CSV file with one email per row. Each email costs 1 credit.
          You have <strong>{user?.credits}</strong> credits.
        </p>
      </div>

      <div className="card">
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
            dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="text-5xl mb-4 block">📂</span>
          <p className="text-gray-600 mb-4">
            {file ? (
              <span className="font-medium text-primary-600">📄 {file.name}</span>
            ) : (
              <>Drag &amp; drop your CSV here, or </>
            )}
          </p>
          <label className="btn-secondary cursor-pointer">
            Choose File
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          <p className="text-xs text-gray-400 mt-3">CSV format: one email per row. Max 10,000 emails.</p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {file && !job && (
          <button
            onClick={handleUpload}
            className="btn-primary mt-4 w-full"
            disabled={loading}
          >
            {loading ? '⏳ Uploading...' : '🚀 Start Verification'}
          </button>
        )}
      </div>

      {job && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Job Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              job.status === 'completed' ? 'bg-green-100 text-green-800' :
              job.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {polling ? '⏳' : ''} {job.status}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{job.processed_emails} / {job.total_emails}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {job.status === 'completed' && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{job.valid_count}</p>
                <p className="text-xs text-gray-600">Valid</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{job.invalid_count}</p>
                <p className="text-xs text-gray-600">Invalid</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{job.risky_count}</p>
                <p className="text-xs text-gray-600">Risky</p>
              </div>
            </div>
          )}

          {job.error_message && (
            <p className="text-sm text-red-600">{job.error_message}</p>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Results (first 100)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2">Disposable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4 font-mono text-xs">{item.email}</td>
                    <td className="py-2 pr-4"><StatusBadge status={item.status} /></td>
                    <td className="py-2 pr-4">{item.deliverability_score}</td>
                    <td className="py-2">{item.is_disposable ? '⚠️ Yes' : '✅ No'}</td>
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
