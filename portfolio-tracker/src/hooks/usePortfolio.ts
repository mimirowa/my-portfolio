import { useEffect, useState } from 'react'
import { fetchStocks, fetchTransactions, post } from '@/lib/api'
import {
  calcPortfolioMetrics,
  HoldingMetrics,
  PortfolioMetrics,
} from '@/lib/calcPortfolioMetrics'

export function usePortfolio() {
  const [holdings, setHoldings] = useState<HoldingMetrics[]>([])
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [stocksResp, txResp] = await Promise.all([
        fetchStocks(),
        fetchTransactions(),
      ])
      const [stocks, txs] = await Promise.all([
        stocksResp.json(),
        txResp.json(),
      ])
      const computed = calcPortfolioMetrics(stocks)
      setHoldings(computed.holdings)
      setMetrics(computed)
      setTransactions(txs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const refresh = loadData

  const updatePrices = async () => {
    setLoading(true)
    try {
      for (const h of holdings) {
        await post(`/stocks/${h.symbol}/price`, {})
      }
      await loadData()
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
