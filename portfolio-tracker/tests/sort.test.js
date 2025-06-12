import assert from 'assert'
import { sortPerformanceData } from '../src/lib/sort.js'

const sample = [
  { symbol: 'A', gain: 10, currentValue: 50 },
  { symbol: 'B', gain: 20, currentValue: 10 },
  { symbol: 'C', gain: -5, currentValue: 30 }
]

const byValue = sortPerformanceData(sample, 'current_value')
assert.deepStrictEqual(byValue.map(s => s.symbol), ['A', 'C', 'B'])

const byGain = sortPerformanceData(sample, 'total_gain')
assert.deepStrictEqual(byGain.map(s => s.symbol), ['B', 'A', 'C'])

console.log('All sorting tests passed.')
