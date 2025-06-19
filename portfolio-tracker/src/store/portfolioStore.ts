import { DateTime } from 'luxon'
import { create } from 'zustand'
import { get } from '@/lib/api'

export type TimeRange = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

export interface HistoryPoint {
  date: string
  market_value_only: number
  with_contributions: number
}

interface PortfolioState {
  history: HistoryPoint[]
  loading: boolean
  selectedRange: TimeRange
  setRange: (r: TimeRange) => void
  fetchHistory: () => Promise<void>
}

function calcRange(range: TimeRange) {
  const now = DateTime.local().startOf('day')
  let from = now
  switch (range) {
    case '1D':
      from = now.minus({ days: 1 })
      break
    case '5D':
      from = now.minus({ days: 5 })
      break
    case '1M':
      from = now.minus({ months: 1 })
      break
    case '6M':
      from = now.minus({ months: 6 })
      break
    case 'YTD':
      from = DateTime.local(now.year, 1, 1)
      break
    case '1Y':
      from = now.minus({ years: 1 })
      break
    case '5Y':
      from = now.minus({ years: 5 })
      break
    case 'MAX':
      from = DateTime.fromISO('1970-01-01')
      break
  }
  return { from: from.toISODate(), to: now.toISODate() }
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  history: [],
  loading: false,
  selectedRange: '1M',
  setRange: (r) => {
    set({ selectedRange: r })
    get().fetchHistory()
  },
  fetchHistory: async () => {
    const { selectedRange } = get()
    const { from, to } = calcRange(selectedRange)
    set({ loading: true })
    try {
      const resp = await get(`/history?start=${from}&end=${to}`)
      if (resp.ok) {
        const data = await resp.json()
        set({ history: data })
      }
    } finally {
      set({ loading: false })
    }
  },
}))
