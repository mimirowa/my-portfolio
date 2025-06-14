import { useEffect, useState } from 'react'
import { fetchStocks, fetchTransactions, fetchSummary, post } from '@/lib/api'
import { HoldingMetrics, PortfolioMetrics } from '@/lib/calcPortfolioMetrics'

export function usePortfolio(baseCurrency: string) {
  const [holdings, setHoldings] = useState<HoldingMetrics[]>([])
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [stocksResp, txResp, summaryResp] = await Promise.all([
        fetchStocks(baseCurrency),
        fetchTransactions(),
        fetchSummary(baseCurrency),
      ])
      const [stocksData, txs, summary] = await Promise.all([
        stocksResp.json(),
        txResp.json(),
        summaryResp.json(),
      ])
      const stocks = stocksData.items || stocksData
      setHoldings(stocks)
      setMetrics(summary)
      setTransactions(txs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [baseCurrency])

  const refresh = loadData

  const updatePrices = async () => {
    setLoading(true)
    try {
      const resp = await post('/prices/refresh', {})
      const data = resp.ok ? await resp.json() : null
      await loadData()
      return data
    } finally {
      setLoading(false)
    }
  }

  return {
    holdings,
    metrics,
    transactions,
    loading,
    refresh,
    updatePrices,
  }
}
