import React, { useMemo } from 'react'
import { Switch } from '@/components/ui/switch.jsx'
import { usePortfolioStore } from '@/store/portfolioStore'
import { useSettings } from '@/store/settingsSlice'
import { getCurrencySymbol } from '@/lib/utils.js'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { DateTime } from 'luxon'

function Chip({ value }: { value: number }) {
  const Icon = value >= 0 ? ChevronUp : ChevronDown
  const color = value >= 0 ? 'text-green-600 bg-green-500/10' : 'text-red-600 bg-red-500/10'
  const sign = value >= 0 ? '+' : ''
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}> 
      <Icon className="w-3 h-3" />
      {sign}{value.toFixed(2)}%
    </span>
  )
}

interface Props {
  includeContributions: boolean
  setIncludeContributions: (v: boolean) => void
}

export default function PortfolioHeader({
  includeContributions,
  setIncludeContributions,
}: Props) {
  const { history, selectedRange } = usePortfolioStore()
  const { baseCurrency } = useSettings()
  const { current, deltaPct, deltaEuro } = useMemo(() => {
    if (!history.length) return { current: 0, deltaPct: 0, deltaEuro: 0 }
    const first = history[0].with_contributions
    const last = history[history.length - 1].with_contributions
    const diff = last - first
    const pct = first !== 0 ? (diff / first) * 100 : 0
    return { current: last, deltaPct: pct, deltaEuro: diff }
  }, [history])

  const currency = getCurrencySymbol(baseCurrency)
  const now = DateTime.local().toFormat('dd LLL, HH:mm ZZZ')

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold">
            {currency}{current.toLocaleString()}
          </h1>
          <Chip value={deltaPct} />
          <small className="text-muted-foreground">
            {deltaEuro >= 0 ? '+' : ''}{deltaEuro.toLocaleString()} {selectedRange}
          </small>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Switch
            checked={includeContributions}
            onCheckedChange={setIncludeContributions}
            id="history-toggle"
          />
          <label htmlFor="history-toggle" className="whitespace-nowrap">
            {includeContributions ? 'Include' : 'Exclude'} contributions
          </label>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{now}</div>
    </div>
  )
}
