import React, { createContext, useContext, useEffect, useState } from 'react'

const DEFAULT_BASE = (import.meta?.env?.VITE_BASE_CURRENCY as string) || 'USD'

type SettingsState = {
  baseCurrency: string
  includeFees: boolean
  setBaseCurrency: (c: string) => void
  setIncludeFees: (v: boolean) => void
}

const SettingsContext = createContext<SettingsState>({
  baseCurrency: DEFAULT_BASE,
  includeFees: false,
  setBaseCurrency: () => {},
  setIncludeFees: () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [baseCurrency, setBaseCurrency] = useState(
    () => localStorage.getItem('baseCurrency') || DEFAULT_BASE
  )
  const [includeFees, setIncludeFees] = useState(
    () => localStorage.getItem('includeFees') === 'true'
  )

  useEffect(() => {
    localStorage.setItem('baseCurrency', baseCurrency)
  }, [baseCurrency])

  useEffect(() => {
    localStorage.setItem('includeFees', includeFees ? 'true' : 'false')
  }, [includeFees])

  return (
    <SettingsContext.Provider
      value={{ baseCurrency, includeFees, setBaseCurrency, setIncludeFees }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
