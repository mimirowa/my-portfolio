import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { DateTime } from 'luxon'
import { usePortfolioStore } from '@/store/portfolioStore'
import TimeFrameTabs from './TimeFrameTabs'

function PortfolioHistoryChart() {
  const [includeContributions, setIncludeContributions] = useState(true)
  const { history, fetchHistory } = usePortfolioStore()

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const formatted = history.map((item) => ({
    ...item,
    date: DateTime.fromISO(item.date).toLocaleString(DateTime.DATE_SHORT)
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Portfolio Value</CardTitle>
          <CardDescription>Historical portfolio value</CardDescription>
        </div>
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
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey={lineKey} stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioHistoryChart
