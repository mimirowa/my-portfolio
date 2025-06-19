import React from 'react'
import { DateTime } from 'luxon'

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

export default function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload?.[0] && label) {
    return (
      <div className="rounded-md bg-white p-2 shadow">
        <div className="font-semibold text-sm">
          {fmtCurrency(payload[0].value)}
        </div>
        <div className="text-xs text-gray-500">
          {DateTime.fromISO(label).toFormat('dd MMM yyyy')}
        </div>
      </div>
    )
  }
  return null
}

function fmtCurrency(value: number) {
  const decimals = Math.abs(value) >= 10000 ? 1 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}
