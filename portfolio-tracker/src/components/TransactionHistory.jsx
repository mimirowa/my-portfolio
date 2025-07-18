import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog.jsx'
import { Trash2, TrendingUp, TrendingDown, Pencil } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/utils.js'
import ImportDialog from '@/components/ImportDialog'
import AddTransactionButton from '@/components/AddTransactionButton'
import EditTransactionModal from '@/components/EditTransactionModal'
import { del } from '@/lib/api'
import { API_BASE_URL } from '@/lib/api'
const BASE_CURRENCY = import.meta?.env?.VITE_BASE_CURRENCY || 'USD'

function TransactionHistory({ transactions, onTransactionDeleted, onTransactionAdded }) {
  const [deletingTransaction, setDeletingTransaction] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const deleteTransaction = async (transactionId) => {
    try {
      setDeletingTransaction(transactionId)
      const response = await del(`/transactions/${transactionId}`)
      
      if (response.ok) {
        onTransactionDeleted()
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    } finally {
      setDeletingTransaction(null)
    }
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your buy and sell transactions</CardDescription>
          </div>
          <div className="flex gap-2 flex-nowrap justify-end">
            <Button onClick={() => setShowImport(true)} variant="outline">
              Import ▼ Google Finance
            </Button>
            <AddTransactionButton onTransactionAdded={onTransactionAdded} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No transactions to display</p>
            <p className="text-sm mt-2">Add your first transaction to get started</p>
          </div>
        </CardContent>
        <ImportDialog
          open={showImport}
          onOpenChange={setShowImport}
          onImported={onTransactionAdded}
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All your buy and sell transactions</CardDescription>
        </div>
        <div className="flex gap-2 flex-nowrap justify-end">
          <Button onClick={() => setShowImport(true)} variant="outline">
            Import ▼ Google Finance
          </Button>
          <AddTransactionButton onTransactionAdded={onTransactionAdded} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price per Share</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-gray-50">
                  <TableCell>
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{transaction.stock_symbol}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.transaction_type === 'buy' ? 'default' : 'destructive'}
                      className="flex items-center gap-1 w-fit"
                    >
                      {transaction.transaction_type === 'buy' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {transaction.transaction_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {transaction.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {getCurrencySymbol(transaction.currency || BASE_CURRENCY)}
                    {transaction.price_per_share.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {getCurrencySymbol(transaction.currency || BASE_CURRENCY)}
                    {transaction.total_value.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingTransaction === transaction.id}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this transaction? This action cannot be undone.
                            <br /><br />
                            <strong>Transaction Details:</strong><br />
                            {transaction.transaction_type.toUpperCase()} {transaction.quantity} shares of {transaction.stock_symbol} at {getCurrencySymbol(transaction.currency || BASE_CURRENCY)}{transaction.price_per_share} on {new Date(transaction.transaction_date).toLocaleDateString()}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTransaction(transaction.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Transactions</p>
              <p className="font-medium">{transactions.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Buy Transactions</p>
              <p className="font-medium text-green-600">
                {transactions.filter(t => t.transaction_type === 'buy').length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Sell Transactions</p>
              <p className="font-medium text-red-600">
                {transactions.filter(t => t.transaction_type === 'sell').length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Volume</p>
              <p className="font-medium">
                {getCurrencySymbol(BASE_CURRENCY)}
                {transactions.reduce((sum, t) => sum + t.total_value, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImported={onTransactionAdded}
      />
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onTransactionUpdated={onTransactionAdded}
      />
    </Card>
  )
}

export default TransactionHistory

