import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import PortfolioHistoryChart from './PortfolioHistoryChart'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

function PortfolioOverview({ portfolioData, portfolioSummary }) {
  if (!portfolioData || portfolioData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Your portfolio is empty. Add some transactions to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No holdings to display</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for pie chart (allocation by value)
  const allocationData = portfolioData.map((stock, index) => ({
    name: stock.symbol,
    value: stock.current_value,
    percentage: portfolioSummary ? ((stock.current_value / portfolioSummary.total_value) * 100).toFixed(1) : 0,
    color: COLORS[index % COLORS.length]
  }))

  // Prepare data for performance chart
  const performanceData = portfolioData.map(stock => ({
    symbol: stock.symbol,
    gain: stock.total_gain,
    gainPercent: stock.total_gain_percent,
    currentValue: stock.current_value
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: ${data.value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Allocation: {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  const PerformanceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.symbol}</p>
          <p className="text-sm text-gray-600">
            Gain/Loss: ${data.gain.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Return: {data.gainPercent.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600">
            Current Value: ${data.currentValue.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PortfolioHistoryChart />
      {/* Portfolio Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
          <CardDescription>Distribution of holdings by value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Stock</CardTitle>
          <CardDescription>Gain/loss for each holding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip content={<PerformanceTooltip />} />
                <Bar 
                  dataKey="gain" 
                  fill={(entry) => entry >= 0 ? '#10B981' : '#EF4444'}
                  name="Gain/Loss ($)"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gain >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Best performing stocks by percentage return</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioData
              .sort((a, b) => b.total_gain_percent - a.total_gain_percent)
              .slice(0, 5)
              .map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-sm text-gray-600">{stock.company_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${stock.total_gain_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.total_gain_percent >= 0 ? '+' : ''}{stock.total_gain_percent.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      ${stock.total_gain.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Holdings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings Summary</CardTitle>
          <CardDescription>Quick overview of your positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioData.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{stock.symbol}</p>
                  <p className="text-sm text-gray-600">{stock.quantity} shares</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${stock.current_value.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    ${stock.current_price?.toFixed(2) || 'N/A'} per share
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PortfolioOverview

