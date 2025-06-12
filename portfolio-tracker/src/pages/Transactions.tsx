import { useState, useEffect } from 'react'
import TransactionHistory from '@/components/TransactionHistory'
import AddTransactionModal from '@/components/AddTransactionModal'
import ImportDialog from '@/components/ImportDialog'
import { Button } from '@/components/ui/button.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const fetchTransactions = async () => {
    const resp = await fetch(`${API_BASE_URL}/transactions`)
    if (resp.ok) setTransactions(await resp.json())
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowImport(true)} variant="outline">
          Import ▸ Google Finance
        </Button>
        <Button onClick={() => setShowAdd(true)}>Add Transaction</Button>
      </div>
      <TransactionHistory
        transactions={transactions}
        onTransactionDeleted={fetchTransactions}
      />
      <AddTransactionModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onTransactionAdded={fetchTransactions}
      />
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImported={fetchTransactions}
      />
    </div>
  )
}
