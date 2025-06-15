import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible.jsx'
import { parseGoogleFinance, importGoogleFinance, parseXlsx } from '@/lib/api'
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
  const [invalidOpen, setInvalidOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    setLoading(true)
    try {
      const res = await parseXlsx(f)
      setRows(res.rows || [])
      setInvalid(res.invalid_rows || [])
      setStep('preview')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

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
    setInvalidOpen(false)
    if (fileInput.current) fileInput.current.value = ''
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
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInput.current?.click()}
              className="border-2 border-dashed rounded p-4 text-center cursor-pointer"
            >
              Drag and drop Excel file here or click to select
              <input
                data-testid="file-input"
                ref={fileInput}
                type="file"
                accept=".xls,.xlsx"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
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
            <Badge className="w-fit">
              <span className="text-green-700">Parsed {rows.length} rows</span>
              {' • '}
              <span className={invalid.length ? 'text-red-700' : 'text-green-700'}>
                {invalid.length} invalid
              </span>
            </Badge>
            {invalid.length > 0 && (
              <Collapsible open={invalidOpen} onOpenChange={setInvalidOpen} className="text-sm">
                <CollapsibleTrigger className="text-red-700 underline">
                  {invalidOpen ? 'Hide invalid lines' : 'Show invalid lines'}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="list-disc pl-4 space-y-1 mt-2">
                    {invalid.slice(0, 10).map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
            <div className="overflow-auto border rounded sm:max-h-[400px]">
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
