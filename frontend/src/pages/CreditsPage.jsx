import React, { useEffect, useState } from 'react'
import { creditsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const CREDIT_PACKS = [
  { name: 'Starter Pack', credits: 100, price: '$5', sku: 'credit-pack-100', icon: '🌱' },
  { name: 'Pro Pack', credits: 500, price: '$20', sku: 'credit-pack-500', icon: '🚀' },
  { name: 'Business Pack', credits: 1000, price: '$35', sku: 'credit-pack-1000', icon: '💼' },
  { name: 'Enterprise Pack', credits: 5000, price: '$149', sku: 'credit-pack-5000', icon: '🏢' },
]

export default function CreditsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    creditsApi.transactions().then((res) => {
      setTransactions(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const wooUrl = import.meta.env.VITE_WOOCOMMERCE_URL || 'https://yourwordpresssite.com/shop'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credits</h1>
        <p className="text-gray-500 mt-1">Manage your email verification credits</p>
      </div>

      {/* Balance */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm">Current Balance</p>
            <p className="text-5xl font-bold mt-1">{user?.credits}</p>
            <p className="text-primary-200 text-sm mt-1">credits available</p>
          </div>
          <span className="text-6xl opacity-30">💳</span>
        </div>
      </div>

      {/* Buy credits */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Buy More Credits</h2>
        <p className="text-gray-600 text-sm mb-4">
          Purchase credits securely via our WordPress/WooCommerce store.
          Credits are automatically added to your account after payment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {CREDIT_PACKS.map((pack) => (
            <a
              key={pack.sku}
              href={`${wooUrl}?add-to-cart=${pack.sku}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-200 rounded-xl p-4 text-center hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <span className="text-3xl block mb-2">{pack.icon}</span>
              <p className="font-semibold text-gray-900">{pack.name}</p>
              <p className="text-primary-600 font-bold text-xl mt-1">{pack.credits} credits</p>
              <p className="text-gray-500 text-sm">{pack.price}</p>
              <div className="mt-3 btn-primary text-xs group-hover:bg-primary-700">Buy Now</div>
            </a>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">ℹ️ How it works:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Click a pack above to visit our WooCommerce store</li>
            <li>Purchase using your preferred payment method</li>
            <li>Credits are automatically added to your account ({user?.email})</li>
            <li>No manual steps required — powered by secure webhooks</li>
          </ol>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4">Reason</th>
                  <th className="pb-2 pr-4 text-right">Amount</th>
                  <th className="pb-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2 pr-4 text-gray-500 text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{tx.source || '—'}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{tx.reason || '—'}</td>
                    <td className={`py-2 pr-4 font-medium text-right ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                    <td className="py-2 text-right font-medium">{tx.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
