import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Switch } from '@/components/ui/switch.jsx'
import { useSettings } from '@/store/settingsSlice'

function PortfolioSummary({ summary }) {
  const { includeFees, setIncludeFees } = useSettings()
  if (!summary) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.total_value.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Cost basis: ${summary.total_cost_basis.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
          {summary.total_gain >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.total_gain.toLocaleString()}
          </div>
          <p className={`text-xs ${summary.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.total_gain_percent >= 0 ? '+' : ''}{summary.total_gain_percent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Holdings</CardTitle>
          <Badge variant="secondary">{summary.stocks_count}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.stocks_count}</div>
          <p className="text-xs text-muted-foreground">Different stocks</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          {summary.total_gain_percent >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.total_gain_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.total_gain_percent >= 0 ? '+' : ''}{summary.total_gain_percent.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">Overall return</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Gain After Fees</CardTitle>
          {summary.net_gain_after_fees >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.net_gain_after_fees >= 0 ? 'text-green-600' : 'text-red-600'}`}>${summary.net_gain_after_fees.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Fees Paid: ${summary.total_fees_paid.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.total_fees_paid.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Brokerage and trading fees</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Include fees in performance</CardTitle>
          <Switch checked={includeFees} onCheckedChange={setIncludeFees} id="fees-toggle" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Toggle to subtract fees when calculating gains
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default PortfolioSummary
