import { calcPortfolioMetrics } from '../src/lib/calcPortfolioMetrics'

test('calcPortfolioMetrics computes totals', () => {
  const holdings = [
    { symbol: 'AAPL', quantity: 10, avg_cost_basis: 100, current_price: 150 },
    { symbol: 'MSFT', quantity: 5, avg_cost_basis: 200, current_price: 180 },
  ]
  const result = calcPortfolioMetrics(holdings)
  expect(result).toMatchSnapshot()
})
