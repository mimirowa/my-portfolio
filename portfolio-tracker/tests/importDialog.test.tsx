import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import ImportDialog from '../src/components/ImportDialog'

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          rows: [1, 2, 3].map((i) => ({
            ticker: 'AAPL',
            action: 'purchase',
            date: '2024-01-01',
            shares: i,
            price: 1,
            amount: i,
            currency: '$',
          })),
          invalid_rows: ['bad1', 'bad2'],
        }),
    })
  ) as any
})

afterEach(() => {
  ;(global.fetch as any).mockReset()
})

test('preview badge shows parsed and invalid counts', async () => {
  const user = userEvent.setup()
  render(<ImportDialog open={true} onOpenChange={() => {}} onImported={() => {}} />)
  const textarea = screen.getByPlaceholderText(/Paste the activity text here/i)
  await user.type(textarea, 'dummy')
  await user.click(screen.getByRole('button', { name: /Parse/i }))
  const badge = await screen.findByText((_, el) =>
    el?.textContent === 'Parsed 3 rows • 2 invalid'
  )
  expect(badge.textContent).toBe('Parsed 3 rows • 2 invalid')
})

test('xlsx file upload triggers preview', async () => {
  const user = userEvent.setup()
  render(<ImportDialog open={true} onOpenChange={() => {}} onImported={() => {}} />)
  const input = screen.getByTestId('file-input') as HTMLInputElement
  const file = new File(['dummy'], 'sample.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  await user.upload(input, file)
  await screen.findByText((_, el) => el?.textContent === 'Parsed 3 rows • 2 invalid')
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/xlsx/preview'), expect.any(Object))
})
