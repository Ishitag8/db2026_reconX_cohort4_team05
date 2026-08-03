// TICKET-ADV125 — RTL test: dashboard summary cards
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@context/ThemeContext';
import { AuthProvider } from '@context/AuthContext';
import { ToastProvider } from '@context/ToastContext.jsx';
import Dashboard from './Dashboard';

// Mock window.matchMedia which is missing in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});


// Mock the useTradeStream hook to return seeded data for the test
vi.mock('@hooks/useTradeStream.js', () => ({
  useTradeStream: () => ({
    trades: [
      { id: 1, tradeRef: 'TRD-2026-0001', instrumentSymbol: 'SAP.DE', quantity: 100, price: 250, status: 'MATCHED' },
      { id: 2, tradeRef: 'TRD-2026-0002', instrumentSymbol: 'SAP.DE', quantity: 50,  price: 251, status: 'UNMATCHED' },
    ],
    isConnected: true,
  }),
}));

function renderWithProviders(ui) {
  sessionStorage.setItem('reconx-token', 'fake-jwt-token');
  sessionStorage.setItem('reconx-role', 'TRADER');
  return render(
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('<Dashboard />', () => {
  it('shows summary cards', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('heading', { name: /portfolio value/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /matched/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /open breaks/i })).toBeInTheDocument();
    
    // 100 * 250 + 50 * 251 = 37,550.00
    expect(screen.getByText(/37,550/)).toBeInTheDocument();
  });
});
