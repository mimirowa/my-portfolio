import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Loader2, Search } from 'lucide-react'

const API_BASE_URL = 'http://localhost:5000/api/portfolio'

function AddTransactionModal({ isOpen, onClose, onTransactionAdded }) {
  const [formData, setFormData] = useState({
    symbol: '',
    transaction_type: 'buy',
    quantity: '',
    price_per_share: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [searchingStock, setSearchingStock] = useState(false)
  const [error, setError] = useState('')
  const [stockInfo, setStockInfo] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const searchStock = async () => {
    if (!formData.symbol.trim()) return
    
    try {
      setSearchingStock(true)
      setError('')
      
      const response = await fetch(`${API_BASE_URL}/stocks/search/${formData.symbol.trim()}`)
      
      if (response.ok) {
        const stockData = await response.json()
        setStockInfo(stockData)
        
        // Auto-fill current price if available
        if (stockData.current_price && !formData.price_per_share) {
          setFormData(prev => ({
            ...prev,
            price_per_share: stockData.current_price.toString()
          }))
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Stock not found')
        setStockInfo(null)
      }
    } catch (error) {
      setError('Error searching for stock')
      setStockInfo(null)
    } finally {
      setSearchingStock(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.symbol.trim()) {
      setError('Stock symbol is required')
      return
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError('Quantity must be a positive number')
      return
    }
    
    if (!formData.price_per_share || parseFloat(formData.price_per_share) <= 0) {
      setError('Price per share must be a positive number')
      return
    }
    
    if (!formData.transaction_date) {
      setError('Transaction date is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          symbol: formData.symbol.trim().toUpperCase(),
          quantity: parseInt(formData.quantity),
          price_per_share: parseFloat(formData.price_per_share)
        })
      })
      
      if (response.ok) {
        onTransactionAdded()
        handleClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add transaction')
      }
    } catch (error) {
      setError('Error adding transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      symbol: '',
      transaction_type: 'buy',
      quantity: '',
      price_per_share: '',
      transaction_date: new Date().toISOString().split('T')[0]
    })
    setError('')
    setStockInfo(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new buy or sell transaction to your portfolio.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stock Symbol */}
          <div className="space-y-2">
            <Label htmlFor="symbol">Stock Symbol</Label>
            <div className="flex gap-2">
              <Input
                id="symbol"
                placeholder="e.g., AAPL"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchStock}
                disabled={searchingStock || !formData.symbol.trim()}
                className="px-3"
              >
                {searchingStock ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {stockInfo && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <p><strong>{stockInfo.symbol}</strong> - {stockInfo.company_name}</p>
                {stockInfo.current_price && (
                  <p>Current Price: ${stockInfo.current_price.toFixed(2)}</p>
                )}
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="transaction_type">Transaction Type</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value) => handleInputChange('transaction_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (Shares)</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="e.g., 100"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
            />
          </div>

          {/* Price per Share */}
          <div className="space-y-2">
            <Label htmlFor="price_per_share">Price per Share ($)</Label>
            <Input
              id="price_per_share"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g., 150.25"
              value={formData.price_per_share}
              onChange={(e) => handleInputChange('price_per_share', e.target.value)}
            />
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transaction_date">Transaction Date</Label>
            <Input
              id="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => handleInputChange('transaction_date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Total Value Preview */}
          {formData.quantity && formData.price_per_share && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Total Transaction Value:</p>
              <p className="text-lg font-semibold">
                ${(parseInt(formData.quantity || 0) * parseFloat(formData.price_per_share || 0)).toLocaleString()}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Transaction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddTransactionModal

