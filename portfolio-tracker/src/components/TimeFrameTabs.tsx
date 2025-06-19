import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { usePortfolioStore, TimeRange } from '@/store/portfolioStore'

const ranges: TimeRange[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX']

export default function TimeFrameTabs() {
  const { selectedRange, setRange } = usePortfolioStore()
  return (
    <Tabs value={selectedRange} onValueChange={setRange} className="w-full">
      <TabsList className="grid grid-cols-8 w-full sm:w-fit">
        {ranges.map((r) => (
          <TabsTrigger key={r} value={r} className="px-2">
            {r}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
