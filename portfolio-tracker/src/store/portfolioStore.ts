import { create } from 'zustand'
import debounce from 'lodash.debounce'
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
  initialValue: number
  currentValue: number
  lastUpdated?: string
  setRange: (r: TimeRange) => void
  fetchHistory: (r?: TimeRange) => void
}


export const usePortfolioStore = create<PortfolioState>((set, get) => {
  const doFetch = async (r: TimeRange) => {
    set({ loading: true })
    try {
      const resp = await get(`/history?range=${r}`)
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
