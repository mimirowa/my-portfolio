import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react'
import PortfolioOverview from './components/PortfolioOverview'
import StockHoldings from './components/StockHoldings'
import TransactionHistory from './components/TransactionHistory'
import Footer from './components/Footer'
import './App.css'
import { get, post } from '@/lib/api'

function App() {
  const [portfolioData, setPortfolioData] = useState([])
  const [portfolioSummary, setPortfolioSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPortfolioData = async () => {
    try {
      setLoading(true)
      const [stocksResponse, summaryResponse, transactionsResponse] = await Promise.all([
        get('/stocks'),
        get('/summary'),
        get('/portfolio/summary'),
        get('/transactions')
      ])

      if (stocksResponse.ok) {
        const stocksData = await stocksResponse.json()
        setPortfolioData(stocksData)
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setPortfolioSummary(summaryData)
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStockPrices = async () => {
    try {
      setLoading(true)
      for (const stock of portfolioData) {
        await post(`/stocks/${stock.symbol}/price`, {})
      }
      await fetchPortfolioData()
    } catch (error) {
      console.error('Error updating stock prices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionAdded = () => {
    fetchPortfolioData()
  }

  const handleTransactionDeleted = () => {
    fetchPortfolioData()
  }

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  if (loading && !portfolioSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Tracker</h1>
            <p className="text-gray-600 mt-1">Track your investments and performance</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={updateStockPrices} 
              variant="outline" 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Update Prices
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        {portfolioSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${portfolioSummary.total_value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Cost basis: ${portfolioSummary.total_cost_basis.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
                {portfolioSummary.total_gain >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${portfolioSummary.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${portfolioSummary.total_gain.toLocaleString()}
                </div>
                <p className={`text-xs ${portfolioSummary.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioSummary.total_gain_percent >= 0 ? '+' : ''}{portfolioSummary.total_gain_percent.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Holdings</CardTitle>
                <Badge variant="secondary">{portfolioSummary.stocks_count}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioSummary.stocks_count}</div>
                <p className="text-xs text-muted-foreground">
                  Different stocks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                {portfolioSummary.total_gain_percent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${portfolioSummary.total_gain_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioSummary.total_gain_percent >= 0 ? '+' : ''}{portfolioSummary.total_gain_percent.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall return
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PortfolioOverview 
              portfolioData={portfolioData} 
              portfolioSummary={portfolioSummary}
            />
          </TabsContent>

          <TabsContent value="holdings" className="space-y-6">
            <StockHoldings 
              portfolioData={portfolioData} 
              onRefresh={fetchPortfolioData}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionHistory
              transactions={transactions}
              onTransactionDeleted={handleTransactionDeleted}
              onTransactionAdded={handleTransactionAdded}
            />
          </TabsContent>
        </Tabs>

        <Footer />
      </div>
    </div>
  )
}

export default App

