import React, { createContext, useContext, useEffect, useState } from 'react'

const DEFAULT_BASE = (import.meta?.env?.VITE_BASE_CURRENCY as string) || 'USD'

type SettingsState = {
  baseCurrency: string
  setBaseCurrency: (c: string) => void
}

const SettingsContext = createContext<SettingsState>({
  baseCurrency: DEFAULT_BASE,
  setBaseCurrency: () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [baseCurrency, setBaseCurrency] = useState(
    () => localStorage.getItem('baseCurrency') || DEFAULT_BASE
  )

  useEffect(() => {
    localStorage.setItem('baseCurrency', baseCurrency)
  }, [baseCurrency])

  return (
    <SettingsContext.Provider value={{ baseCurrency, setBaseCurrency }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
