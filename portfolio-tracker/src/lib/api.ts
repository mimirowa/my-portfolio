export const API_BASE_URL =
  import.meta.env?.VITE_API_URL?.replace(/\/+$/, '') || window.location.origin

export const get = (url: string) => fetch(`${API_BASE_URL}${url}`)
export const post = (url: string, body: any) =>
  fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })

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
