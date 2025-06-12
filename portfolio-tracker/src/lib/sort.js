export function sortPerformanceData(data, metric = 'current_value') {
  const key = metric === 'total_gain' ? 'gain' : 'currentValue'
  return [...data].sort((a, b) => b[key] - a[key])
}
