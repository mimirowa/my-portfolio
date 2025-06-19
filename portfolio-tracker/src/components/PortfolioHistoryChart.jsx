import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { DateTime } from 'luxon'
import { usePortfolioStore } from '@/store/portfolioStore'
import TimeFrameTabs from './TimeFrameTabs'
import PortfolioHeader from './PortfolioHeader'

function PortfolioHistoryChart() {
  const [includeContributions, setIncludeContributions] = useState(true)
  const { history, fetchHistory } = usePortfolioStore()

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const formatted = history.map((item) => ({
    ...item,
    date: DateTime.fromISO(item.date).toLocaleString(DateTime.DATE_SHORT),
  }))

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
        <div className="h-80">
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
              <Area
                type="monotone"
                dataKey={lineKey}
                stroke="#4f46e5"
                strokeWidth={3}
                fill="url(#valueGradient)"
                fillOpacity={0.15}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioHistoryChart
