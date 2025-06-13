import React from 'react'
import { API_BASE_URL } from '@/lib/api'

const version = import.meta.env.VITE_APP_VERSION

export default function Footer() {
  return (
    <footer className="text-center text-xs text-muted-foreground py-6">
      v{version} · {API_BASE_URL}
    </footer>
  )
}
