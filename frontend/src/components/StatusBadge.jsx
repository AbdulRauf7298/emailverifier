import React from 'react'

export default function StatusBadge({ status }) {
  const classes = {
    valid: 'badge-valid',
    invalid: 'badge-invalid',
    risky: 'badge-risky',
    unknown: 'badge-unknown',
  }
  const icons = {
    valid: '✅',
    invalid: '❌',
    risky: '⚠️',
    unknown: '❓',
  }
  return (
    <span className={classes[status] || 'badge-unknown'}>
      {icons[status] || '❓'} {status}
    </span>
  )
}
