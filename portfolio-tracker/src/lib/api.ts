const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ||
  (process.env as any)

export const BASE = (env.VITE_PORTFOLIO_API ?? '').replace(/\/$/, '')
const IMPORT_API = env.VITE_IMPORT_API ?? BASE

export const API_BASE_URL = BASE

export const get = (path: string) => fetch(`${BASE}${path}`)
export const post = (path: string, body: any) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
export const del = (path: string) => fetch(`${BASE}${path}`, { method: 'DELETE' })

export const fetchStocks = (base?: string) =>
  fetch(`${BASE}/stocks${base ? `?base=${base}` : ''}`)
export const fetchSummary = (base?: string) =>
  fetch(`${BASE}/summary${base ? `?base=${base}` : ''}`)
export const fetchTransactions = () => fetch(`${BASE}/transactions`)
export const searchStock = (s: string) =>
  fetch(`${BASE}/stocks/search/${encodeURIComponent(s)}`)
export const fetchCurrentPrice = (symbol: string) =>
  fetch(`${BASE}/stocks/${encodeURIComponent(symbol)}`)
export const addTransaction = (body: any) =>
  fetch(`${BASE}/transactions`, {
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

export async function parseXlsx(file: File) {
  const form = new FormData()
  form.append('file', file)
  const resp = await fetch(`${IMPORT_API}/xlsx/preview`, {
    method: 'POST',
    body: form,
  })
  if (!resp.ok) throw new Error('Failed to parse')
  return resp.json()
}
