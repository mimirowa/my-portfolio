import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Switch } from '@/components/ui/switch.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL

function PortfolioHistoryChart() {
  const [history, setHistory] = useState([])
  const [includeContributions, setIncludeContributions] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/history`)
        if (resp.ok) {
          const data = await resp.json()
          setHistory(data)
        }
      } catch (err) {
        console.error('Error fetching portfolio history:', err)
      }
    }

    fetchHistory()
  }, [])

  const formatted = history.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString()
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
