import { Button } from '@/components/ui/button.jsx'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select.jsx'
import { RefreshCw } from 'lucide-react'
import { Switch } from '@/components/ui/switch.jsx'
import { Label } from '@/components/ui/label.jsx'
import { useSettings } from '@/store/settingsSlice'
import { SUPPORTED_CCY } from '@/lib/currencies.js'

export default function Header({ onUpdatePrices, loading }) {
  const { baseCurrency, setBaseCurrency, includeFees, setIncludeFees } = useSettings()
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolio Tracker</h1>
        <p className="text-gray-600 mt-1">Track your investments and performance</p>
      </div>
      <div className="flex gap-3 items-center">
        <Select value={baseCurrency} onValueChange={setBaseCurrency}>
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CCY.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={onUpdatePrices}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Update Prices
        </Button>
        <Label htmlFor="fees-toggle">Show fees:</Label>
        <Switch id="fees-toggle" checked={includeFees} onCheckedChange={setIncludeFees} />
      </div>
    </div>
  )
}
