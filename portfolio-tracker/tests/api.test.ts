import { jest } from '@jest/globals'

beforeEach(() => {
  import.meta.env = { VITE_PORTFOLIO_API: 'http://localhost:1234/api/portfolio' }
  process.env.VITE_PORTFOLIO_API = 'http://localhost:1234/api/portfolio'
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true })
  ) as any
})

afterEach(() => {
  delete import.meta.env
  delete process.env.VITE_PORTFOLIO_API
  ;(global.fetch as any).mockReset()
})

test('fetchSummary uses portfolio API base', async () => {
  const { fetchSummary } = await import('../src/lib/api')
  await fetchSummary()
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:1234/api/portfolio/summary'
  )
})
