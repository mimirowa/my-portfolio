import { jest } from '@jest/globals'

beforeEach(() => {
  process.env.VITE_PORTFOLIO_API = 'http://localhost:1234/api/portfolio'
  process.env.VITE_IMPORT_API = 'http://localhost:1234/api/import'
  global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as any
})

afterEach(() => {
  delete process.env.VITE_PORTFOLIO_API
  delete process.env.VITE_IMPORT_API
  ;(global.fetch as any).mockReset()
})

test('get uses portfolio API base', async () => {
  const { get } = await import('../src/lib/api')
  await get('/summary')
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:1234/api/portfolio/summary',
    undefined
  )
})
