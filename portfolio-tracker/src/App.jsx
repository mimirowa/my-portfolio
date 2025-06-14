import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react'
import PortfolioOverview from './components/PortfolioOverview'
import StockHoldings from './components/StockHoldings'
import TransactionHistory from './components/TransactionHistory'
import PortfolioSummary from './components/PortfolioSummary'
import Footer from './components/Footer'
import './App.css'
import { toast } from 'sonner'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Toaster } from '@/components/ui/sonner.jsx'

function App() {
  const {
    holdings: portfolioData,
    metrics: portfolioSummary,
    transactions,
    loading,
    refresh,
    updatePrices,
  } = usePortfolio()

  const updateStockPrices = async () => {
    const result = await updatePrices()
    if (result && typeof result.updated === 'number') {
      toast.success(`Updated ${result.updated} prices`)
    } else {
      toast.error('Failed to refresh prices')
    }
  }

  const handleTransactionAdded = refresh

  const handleTransactionDeleted = refresh

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
        <PortfolioSummary summary={portfolioSummary} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PortfolioOverview portfolioData={portfolioData} />
          </TabsContent>

          <TabsContent value="holdings" className="space-y-6">
            <StockHoldings
              portfolioData={portfolioData}
              onRefresh={refresh}
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

