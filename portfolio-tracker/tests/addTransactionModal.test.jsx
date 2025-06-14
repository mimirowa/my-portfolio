import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import AddTransactionModal from '../src/components/AddTransactionModal'

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ symbol: 'AAPL', price: 123.45 })
    })
  )
})

afterEach(() => {
  global.fetch.mockReset()
})

test('auto-populates price after successful search', async () => {
  const user = userEvent.setup()
  render(
    <AddTransactionModal isOpen={true} onClose={() => {}} onTransactionAdded={() => {}} />
  )

  const symbolInput = screen.getByPlaceholderText(/AAPL/i)
  await user.type(symbolInput, 'AAPL')
  const searchButton = symbolInput.parentNode.querySelector('button')
  await user.click(searchButton)

  const priceInput = screen.getByLabelText(/Price per Share/i)
  await waitFor(() => expect(priceInput.value).toBe('123.45'))
})
