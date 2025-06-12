import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/utils.js'

const API_BASE_URL = import.meta.env.VITE_API_URL
const BASE_CURRENCY = import.meta.env.VITE_BASE_CURRENCY || 'USD'

function StockHoldings({ portfolioData, onRefresh, loading }) {
  const [updatingStock, setUpdatingStock] = useState(null)

  const updateSingleStockPrice = async (symbol) => {
    try {
      setUpdatingStock(symbol)
      const response = await fetch(`${API_BASE_URL}/stocks/${symbol}/price`, {
        method: 'POST'
      })
      
      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating stock price:', error)
    } finally {
      setUpdatingStock(null)
    }
  }

  if (!portfolioData || portfolioData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Holdings</CardTitle>
          <CardDescription>Your current stock positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No holdings to display</p>
            <p className="text-sm mt-2">Add some transactions to see your portfolio here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Holdings</CardTitle>
        <CardDescription>Your current stock positions and performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Total Gain/Loss</TableHead>
                <TableHead className="text-right">Return %</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioData.map((stock) => (
                <TableRow key={stock.symbol} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stock.symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {stock.quantity > 0 ? 'LONG' : 'SHORT'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {stock.company_name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {stock.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {getCurrencySymbol(BASE_CURRENCY)}
                    {stock.avg_cost_basis?.toFixed(2) || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getCurrencySymbol(BASE_CURRENCY)}
                      {stock.current_price?.toFixed(2) || 'N/A'}
                      {stock.last_updated && (
                        <span className="text-xs text-gray-500">
                          {new Date(stock.last_updated).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {getCurrencySymbol(BASE_CURRENCY)}
                    {stock.current_value?.toLocaleString() || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {stock.total_gain >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${stock.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                        {getCurrencySymbol(BASE_CURRENCY)}
                        {stock.total_gain?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${stock.total_gain_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.total_gain_percent >= 0 ? '+' : ''}{stock.total_gain_percent?.toFixed(2) || 'N/A'}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateSingleStockPrice(stock.symbol)}
                        disabled={updatingStock === stock.symbol || loading}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`h-3 w-3 ${updatingStock === stock.symbol ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://finance.yahoo.com/quote/${stock.symbol}`, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Row */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Positions</p>
              <p className="font-medium">{portfolioData.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Shares</p>
              <p className="font-medium">
                {portfolioData.reduce((sum, stock) => sum + stock.quantity, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Value</p>
              <p className="font-medium">
                {getCurrencySymbol(BASE_CURRENCY)}
                {portfolioData.reduce((sum, stock) => sum + (stock.current_value || 0), 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Gain/Loss</p>
              <p className={`font-medium ${portfolioData.reduce((sum, stock) => sum + (stock.total_gain || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getCurrencySymbol(BASE_CURRENCY)}
                {portfolioData.reduce((sum, stock) => sum + (stock.total_gain || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StockHoldings

