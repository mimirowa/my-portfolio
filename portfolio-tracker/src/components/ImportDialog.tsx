import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { parseGoogleFinance, importGoogleFinance } from '@/lib/api'
import { getCurrencySymbol } from '@/lib/utils.js'
import { toast } from 'sonner'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onImported: () => void
}

export default function ImportDialog({ open, onOpenChange, onImported }: ImportDialogProps) {
  const [raw, setRaw] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [invalid, setInvalid] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'idle' | 'preview'>('idle')

  const handleParse = async () => {
    setLoading(true)
    try {
      const res = await parseGoogleFinance(raw)
      setRows(res.rows || [])
      setInvalid(res.invalid_rows || [])
      setStep('preview')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const res = await importGoogleFinance(raw)
      if (res.duplicates_skipped) {
        toast.success(`Skipped ${res.duplicates_skipped} duplicates`)
      }
      onImported()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setRaw('')
    setRows([])
    setInvalid([])
    setStep('idle')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import from Google Finance</DialogTitle>
        </DialogHeader>
        {step === 'idle' && (
          <div className="space-y-4">
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste the activity text here"
              className="h-40"
            />
            <Button onClick={handleParse} disabled={loading || !raw.trim()}>Parse</Button>
          </div>
        )}
        {step === 'preview' && (
          <div className="space-y-4">
            {invalid.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  {invalid.length} invalid lines ignored
                </AlertDescription>
              </Alert>
            )}
            <div className="max-h-64 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{r.ticker}</TableCell>
                      <TableCell>{r.action}</TableCell>
                      <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{r.shares}</TableCell>
                      <TableCell className="text-right">{getCurrencySymbol(r.currency)}{r.price}</TableCell>
                      <TableCell className="text-right">{getCurrencySymbol(r.currency)}{r.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('idle')}>Back</Button>
              <Button onClick={handleImport} disabled={loading}>Confirm & Save</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
