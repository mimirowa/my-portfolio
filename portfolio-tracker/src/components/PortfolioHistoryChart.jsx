import { useEffect, useState, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { DateTime } from 'luxon'
import { usePortfolioStore } from '@/store/portfolioStore'
import { useSettings } from '@/store/settingsSlice'
import { getCurrencySymbol } from '@/lib/utils.js'
import TimeFrameTabs from './TimeFrameTabs'
import CustomTooltip from './CustomTooltip'
import PortfolioHeader from './PortfolioHeader'

function PortfolioHistoryChart() {
  const [includeContributions, setIncludeContributions] = useState(true)
  const [brushInfo, setBrushInfo] = useState(null)
  const containerRef = useRef(null)
  const { history, fetchHistory, selectedRange } = usePortfolioStore()
  const { baseCurrency } = useSettings()

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    setBrushInfo(null)
  }, [selectedRange])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setBrushInfo(null)
    }
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setBrushInfo(null)
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  const formatted = history.map((item) => ({
    ...item,
    date: DateTime.fromISO(item.date).toLocaleString(DateTime.DATE_SHORT),
  }))

  const monthStarts = history
    .filter((h) => DateTime.fromISO(h.date).day === 1)
    .map((h) => DateTime.fromISO(h.date).toLocaleString(DateTime.DATE_SHORT))

  const brushEnabled = ['1M', '6M', 'YTD', '1Y', '5Y', 'MAX'].includes(selectedRange)

  const lineKey = includeContributions ? 'with_contributions' : 'market_value_only'

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-xs">
          <p className="font-medium">{label}</p>
          <p>${payload[0].value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  const handleBrushChange = (range) => {
    if (range && typeof range.startIndex === 'number' && typeof range.endIndex === 'number') {
      const start = formatted[range.startIndex][lineKey]
      const end = formatted[range.endIndex][lineKey]
      const delta = end - start
      const pct = start ? (delta / start) * 100 : 0
      setBrushInfo({ delta, pct })
    } else {
      setBrushInfo(null)
    }
  }
  return (
    <Card>
      <CardHeader className="space-y-4">
        <PortfolioHeader />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <TimeFrameTabs />
          <div className="flex items-center space-x-2 text-sm">
            <Switch
              checked={includeContributions}
              onCheckedChange={setIncludeContributions}
              id="history-toggle"
            />
            <label htmlFor="history-toggle">
              {includeContributions ? 'Include' : 'Exclude'} contributions
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-80 relative">
          {brushInfo && brushEnabled && (
            <div className="absolute bottom-10 left-2 bg-white border rounded shadow px-2 py-1 text-xs">
              {getCurrencySymbol(baseCurrency)}{brushInfo.delta.toLocaleString()} ({brushInfo.pct.toFixed(2)}%)
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              {monthStarts.map((d) => (
                <ReferenceLine key={d} x={d} stroke="#ddd" strokeDasharray="3 3" />
              ))}
              <Line type="monotone" dataKey={lineKey} stroke="#8884d8" dot={false} />
              {brushEnabled && <Brush dataKey="date" onChange={handleBrushChange} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioHistoryChart
