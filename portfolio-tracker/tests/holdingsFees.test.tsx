import React from 'react'
import { render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'
import StockHoldings from '../src/components/StockHoldings'

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any
})

afterEach(() => {
  ;(global.fetch as any).mockReset()
})

const data = [
  {
    symbol: 'AAPL',
    company_name: 'Apple',
    quantity: 1,
    avg_cost_basis: 100,
    current_price: 150,
    current_value: 150,
    total_gain: 50,
    total_gain_percent: 50,
    fees_paid: 3.5,
  },
]

test('shows fees column with numeric values', () => {
  render(<StockHoldings portfolioData={data} onRefresh={() => {}} loading={false} />)
  expect(screen.getByText('Fees')).toBeInTheDocument()
  expect(screen.getAllByText(/3\.5/).length).toBeGreaterThan(0)
})
