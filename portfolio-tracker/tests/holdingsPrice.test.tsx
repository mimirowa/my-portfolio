import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import StockHoldings from '../src/components/StockHoldings'

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ current_price: 123.45 }) })
  ) as any
})

afterEach(() => {
  ;(global.fetch as any).mockReset()
})

test('shows fetched current price', async () => {
  render(
    <StockHoldings
      portfolioData={[{
        symbol: 'AAPL',
        company_name: 'Apple',
        quantity: 1,
        avg_cost_basis: 100,
        current_price: null,
        last_updated: null,
        current_value: 0,
        total_gain: 0,
        total_gain_percent: 0,
      }]}
      onRefresh={() => {}}
      loading={false}
    />
  )
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  const matches = await screen.findAllByText(/123\.45/)
  expect(matches.length).toBeGreaterThan(0)
})
