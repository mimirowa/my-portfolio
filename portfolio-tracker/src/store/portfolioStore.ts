import { create } from 'zustand'
import debounce from 'lodash.debounce'
import { get } from '@/lib/api'
import { DateTime } from 'luxon'

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
  initialValue: number
  currentValue: number
  lastUpdated?: string
  setRange: (r: TimeRange) => void
  fetchHistory: (r?: TimeRange) => void
}

export function rangeToParams(r: TimeRange) {
  const today = DateTime.now().startOf('day')
  switch (r) {
    case '1D':
      return { from: today.minus({ days: 1 }), to: today, granularity: 'hour' }
    case '5D':
      return { from: today.minus({ days: 5 }), to: today, granularity: 'day' }
    case '1M':
      return { from: today.minus({ days: 30 }), to: today, granularity: 'day' }
    case '6M':
      return { from: today.minus({ days: 182 }), to: today, granularity: 'week' }
    case 'YTD':
      return { from: DateTime.local(today.year, 1, 1), to: today, granularity: 'day' }
    case '1Y':
      return { from: today.minus({ days: 365 }), to: today, granularity: 'week' }
    case '5Y':
      return { from: today.minus({ days: 365 * 5 }), to: today, granularity: 'month' }
    case 'MAX':
      return { from: DateTime.fromISO('1970-01-01'), to: today, granularity: 'month' }
    default:
      return { from: today.minus({ days: 30 }), to: today, granularity: 'day' }
  }
}


export const usePortfolioStore = create<PortfolioState>((set, get) => {
  const doFetch = async (r: TimeRange) => {
    set({ loading: true })
    try {
      const { from, to, granularity } = rangeToParams(r)
      const url = `/history?from=${from.toISODate()}&to=${to.toISODate()}&granularity=${granularity}`
      const resp = await get(url)
      if (resp.ok) {
        const data = await resp.json()
        const history = data.history ?? []
        set({
          history,
          lastUpdated: data.last_updated,
          initialValue: history[0]?.with_contributions ?? 0,
          currentValue: history[history.length - 1]?.with_contributions ?? 0,
        })
      }
    } finally {
      set({ loading: false })
    }
  }

  const debounced = debounce(doFetch, 250)

  return {
    history: [],
    loading: false,
    selectedRange: '1M',
    initialValue: 0,
    currentValue: 0,
    lastUpdated: undefined,
    setRange: (r) => {
      set({ selectedRange: r })
      debounced(r)
    },
    fetchHistory: (r?: TimeRange) => {
      debounced(r ?? get().selectedRange)
    },
  }
})
