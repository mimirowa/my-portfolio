import { sortPerformanceData } from '../src/lib/sort.js'

const sample = [
  { symbol: 'A', gain: 10, currentValue: 50 },
  { symbol: 'B', gain: 20, currentValue: 10 },
  { symbol: 'C', gain: -5, currentValue: 30 }
]

test('sortPerformanceData sorts correctly', () => {
  const byValue = sortPerformanceData(sample, 'current_value')
  expect(byValue.map(s => s.symbol)).toEqual(['A', 'C', 'B'])

  const byGain = sortPerformanceData(sample, 'total_gain')
  expect(byGain.map(s => s.symbol)).toEqual(['B', 'A', 'C'])
})
