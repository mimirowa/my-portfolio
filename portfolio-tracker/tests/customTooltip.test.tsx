import React from 'react'
import { render } from '@testing-library/react'
import CustomTooltip from '../src/components/CustomTooltip'

test('tooltip formats date and value', () => {
  const { container } = render(
    <CustomTooltip
      active={true}
      label="2024-06-01"
      payload={[{ value: 1234.56 }]}
    />
  )
  expect(container.textContent).toContain('€1,234.56')
  expect(container.textContent).toContain('01 Jun 2024')
})
