import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StockHoldings from '../src/components/StockHoldings'
import Header from '../src/components/Header.jsx'
import { SettingsProvider } from '../src/store/settingsSlice'
import { jest } from '@jest/globals'

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any
  localStorage.clear()
})

afterEach(() => {
  ;(global.fetch as any).mockReset()
})

const holdings = [
  {
    symbol: 'AAPL',
    company_name: 'Apple',
    quantity: 1,
    avg_cost_basis: 100,
    current_price: 150,
    current_value: 150,
    total_gain: 50,
    total_gain_percent: 50,
    fees_paid: 2,
  },
]


test('gain switches when fees toggle flipped', async () => {
  const user = userEvent.setup()
  render(
    <SettingsProvider>
      <Header onUpdatePrices={() => {}} loading={false} />
      <StockHoldings portfolioData={holdings} onRefresh={() => {}} loading={false} />
    </SettingsProvider>
  )
  expect(screen.getAllByText('$50').length).toBeGreaterThan(0)
  const toggle = screen.getByRole('switch')
  await user.click(toggle)
  expect(screen.getAllByText('$48').length).toBeGreaterThan(0)
})
