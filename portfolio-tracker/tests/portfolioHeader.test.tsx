import React from 'react'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import PortfolioHeader from '../src/components/PortfolioHeader'
import { SettingsProvider, useSettings } from '../src/store/settingsSlice'
import { usePortfolioStore } from '../src/store/portfolioStore'

beforeEach(() => {
  usePortfolioStore.setState({ history: [], selectedRange: '1M' })
  localStorage.clear()
})

function Wrapper({ children }: { children?: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>
}

function SetEUR() {
  const { setBaseCurrency } = useSettings()
  React.useEffect(() => {
    setBaseCurrency('EUR')
  }, [setBaseCurrency])
  return null
}

test('shows current value and delta', () => {
  act(() => {
    usePortfolioStore.setState({
      history: [
        { date: '2025-06-18', market_value_only: 100, with_contributions: 100 },
        { date: '2025-06-19', market_value_only: 110, with_contributions: 110 },
      ],
    })
  })
  render(
    <Wrapper>
      <SetEUR />
      <PortfolioHeader />
    </Wrapper>
  )
  expect(screen.getByRole('heading').textContent).toContain('€110')
  expect(screen.getAllByText(/\+10/).length).toBeGreaterThan(0)
})
