// frontend/src/pages/Dashboard.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@context/ThemeContext';
import { AuthContext }   from '@context/AuthContext';
import Dashboard         from './Dashboard';

const trades = [
  { id: 1, tradeRef: 'TRD-2026-0001', instrument: 'SAP.DE', quantity: 100, price: 250, status: 'MATCHED'   },
  { id: 2, tradeRef: 'TRD-2026-0002', instrument: 'SAP.DE', quantity: 50,  price: 251, status: 'UNMATCHED' },
];

// Mock the useTradeStream hook to return seeded data for the test
vi.mock('@hooks/useTradeStream.js', () => ({
  useTradeStream: () => ({
    trades,
    isConnected: true,
  }),
}));

// Mock the api service call
vi.mock('@services/apiService.js', () => ({
  api: {
    getStats: () => Promise.resolve({
      totalPortfolioValue: 37550,
      totalTrades: 2,
      matchedTrades: 1,
      openBreaks: 1
    })
  }
}));

// Mock window.matchMedia for JSDOM compatibility
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

function renderWithProviders(ui) {
  const user = { email: 'trader@db.com', role: 'TRADER' };
  return render(
    <AuthContext.Provider value={{ user, isLoading: false }}>
      <ThemeProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

describe('<Dashboard />', () => {
  it('shows summary cards', async () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('heading', { name: /portfolio value/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /matched/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /open breaks/i })).toBeInTheDocument();
    // Wait for the async API stats resolve
    expect(await screen.findByText(/37,550/)).toBeInTheDocument();
  });
});
