import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '../src/components/Header.jsx'
import { SettingsProvider, useSettings } from '../src/store/settingsSlice'
import { useEffect } from 'react'

beforeEach(() => {
  localStorage.clear()
})

function Wrapper({ children }: { children?: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>
}

function Helper() {
  const { setBaseCurrency } = useSettings()
  useEffect(() => {
    setBaseCurrency('EUR')
  }, [setBaseCurrency])
  return null
}

test('picker value persists after reload', () => {
  const { unmount } = render(
    <Wrapper>
      <Header onUpdatePrices={() => {}} loading={false} />
      <Helper />
    </Wrapper>
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('EUR')
  unmount()
  render(
    <Wrapper>
      <Header onUpdatePrices={() => {}} loading={false} />
    </Wrapper>
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('EUR')
})
