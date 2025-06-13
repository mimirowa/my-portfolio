const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || process.env as any

const PORTFOLIO_BASE = (env?.VITE_PORTFOLIO_API || '').replace(/\/+$/, '')
const IMPORT_BASE = (env?.VITE_IMPORT_API || '').replace(/\/+$/, '') || PORTFOLIO_BASE

export const API_BASE_URL = PORTFOLIO_BASE || (typeof window !== 'undefined' ? window.location.origin : '')

function request(path: string, options?: RequestInit) {
  const base = path.startsWith('/import/') ? IMPORT_BASE : PORTFOLIO_BASE
  return fetch(`${base}${path}`, options)
}

export const get = (path: string) => request(path)
export const post = (path: string, body: any) =>
  request(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
export const del = (path: string) => request(path, { method: 'DELETE' })

export async function parseGoogleFinance(raw: string) {
  const resp = await post('/import/google-finance/preview', { raw })
  if (!resp.ok) throw new Error('Failed to parse')
  return resp.json()
}

export async function importGoogleFinance(raw: string) {
  const resp = await post('/import/google-finance', { raw })
  if (!resp.ok) throw new Error('Failed to import')
  return resp.json()
}
