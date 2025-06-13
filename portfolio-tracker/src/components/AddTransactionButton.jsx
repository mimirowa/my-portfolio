import { useState } from 'react'
import AddTransactionModal from '@/components/AddTransactionModal'
import { Button } from '@/components/ui/button.jsx'

export default function AddTransactionButton({ onTransactionAdded }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Transaction</Button>
      <AddTransactionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onTransactionAdded={() => {
          onTransactionAdded && onTransactionAdded()
          setOpen(false)
        }}
      />
    </>
  )
}
