const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ||
  (process.env as any)

const API = env.VITE_PORTFOLIO_API ?? ''
const IMPORT_API = env.VITE_IMPORT_API ?? API

export const API_BASE_URL = API

export const get = (path: string) => fetch(`${API}${path}`)
export const post = (path: string, body: any) =>
  fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
export const del = (path: string) => fetch(`${API}${path}`, { method: 'DELETE' })

export const getStocks = () => fetch(`${API}/stocks`).then(r => r.json())
export const getSummary = () => fetch(`${API}/portfolio/summary`).then(r => r.json())
export const getTransactions = () => fetch(`${API}/transactions`).then(r => r.json())
export const searchStock = (s: string) =>
  fetch(`${API}/stocks/search/${encodeURIComponent(s)}`).then(r => r.json())
export const addTransaction = (body: any) =>
  fetch(`${API}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

export async function parseGoogleFinance(raw: string) {
  const resp = await fetch(`${IMPORT_API}/google-finance/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  })
  if (!resp.ok) throw new Error('Failed to parse')
  return resp.json()
}

export async function importGoogleFinance(raw: string) {
  const resp = await fetch(`${IMPORT_API}/google-finance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  })
  if (!resp.ok) throw new Error('Failed to import')
  return resp.json()
}
