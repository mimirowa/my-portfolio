import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import TransactionHistory from '../src/components/TransactionHistory';

// mock fetch
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  ) as any;
});

afterAll(() => {
  (global.fetch as any).mockRestore && (global.fetch as any).mockRestore();
});

test('shows Import button', async () => {
  render(
    <TransactionHistory
      transactions={[]}
      onTransactionDeleted={() => {}}
      onTransactionAdded={() => {}}
    />
  );
  expect(await screen.findByRole('button', { name: /Import/i })).toBeInTheDocument();
});
