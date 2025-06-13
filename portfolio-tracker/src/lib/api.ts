const BASE = (import.meta?.env?.VITE_API_URL || '').replace(/\/portfolio$/, '')

export async function parseGoogleFinance(raw: string) {
  const resp = await fetch(`${BASE}/import/google-finance/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  })
  if (!resp.ok) throw new Error('Failed to parse')
  return resp.json()
}

export async function importGoogleFinance(raw: string) {
  const resp = await fetch(`${BASE}/import/google-finance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  })
  if (!resp.ok) throw new Error('Failed to import')
  return resp.json()
}
