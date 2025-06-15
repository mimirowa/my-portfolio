export interface Holding {
  symbol: string
  company_name?: string
  quantity: number
  avg_cost_basis: number
  current_price?: number | null
  fees_paid?: number
}

export interface HoldingMetrics extends Holding {
  current_value: number
  cost_basis: number
  total_gain: number
  total_gain_percent: number
}

export interface PortfolioMetrics {
  total_value: number
  total_cost_basis: number
  total_gain: number
  total_gain_percent: number
  total_fees_paid: number
  net_gain_after_fees: number
  stocks_count: number
  holdings: HoldingMetrics[]
}

export function calcPortfolioMetrics(holdings: Holding[]): PortfolioMetrics {
  let totalValue = 0
  let totalCostBasis = 0
  let totalFees = 0
  const metrics: HoldingMetrics[] = holdings.map((h) => {
    const price = h.current_price ?? 0
    const currentValue = h.quantity * price
    const costBasis = h.quantity * h.avg_cost_basis
    const totalGain = currentValue - costBasis
    const totalGainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0
    totalValue += currentValue
    totalCostBasis += costBasis
    totalFees += h.fees_paid ?? 0
    return {
      ...h,
      current_value: currentValue,
      cost_basis: costBasis,
      total_gain: totalGain,
      total_gain_percent: totalGainPercent,
    }
  })
  const totalGain = totalValue - totalCostBasis
  const totalGainPercent =
    totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0
  return {
    total_value: totalValue,
    total_cost_basis: totalCostBasis,
    total_gain: totalGain,
    total_gain_percent: totalGainPercent,
    total_fees_paid: totalFees,
    net_gain_after_fees: totalGain - totalFees,
    stocks_count: metrics.length,
    holdings: metrics,
  }
}
