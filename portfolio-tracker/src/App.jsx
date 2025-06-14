import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { RefreshCw } from 'lucide-react'
import PortfolioOverview from './components/PortfolioOverview'
import StockHoldings from './components/StockHoldings'
import TransactionHistory from './components/TransactionHistory'
import PortfolioSummary from './components/PortfolioSummary'
import Footer from './components/Footer'
import './App.css'
import { toast } from 'sonner'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Toaster } from '@/components/ui/sonner.jsx'
import Header from '@/components/Header.jsx'
import { useSettings } from '@/store/settingsSlice'

function App() {
  const { baseCurrency } = useSettings()
  const {
    holdings: portfolioData,
    metrics: portfolioSummary,
    transactions,
    loading,
    refresh,
    updatePrices,
  } = usePortfolio(baseCurrency)

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
        <Header onUpdatePrices={updateStockPrices} loading={loading} />

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

