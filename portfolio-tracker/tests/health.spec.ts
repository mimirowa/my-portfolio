import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import App from '../src/App'

beforeEach(() => {
  // simulate environment variables used by the api helper
  window.process = { env: { VITE_PORTFOLIO_API: 'http://test' } } as any
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  ) as any
})

afterEach(() => {
  // cleanup mocked objects
  delete (window as any).process
  ;(global.fetch as any).mockReset()
})

test('App fetches data from configured API base', async () => {
  render(<App />)

  await waitFor(() => expect(global.fetch).toHaveBeenCalled())

  expect(global.fetch).toHaveBeenCalledWith('http://test/stocks')
  expect(global.fetch).toHaveBeenCalledWith('http://test/portfolio/summary')
  expect(global.fetch).toHaveBeenCalledWith('http://test/transactions')
})
