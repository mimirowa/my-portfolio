import React from 'react'

const version = import.meta.env.VITE_APP_VERSION

export default function Footer() {
  return (
    <footer className="text-center text-xs text-muted-foreground py-6">
      v{version}
    </footer>
  )
}
