// TICKET-ADV122 — Lazy + Suspense for route-based code splitting
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { withErrorBoundary } from '@components/withErrorBoundary.jsx';
import { useAuth } from '@context/AuthContext.jsx';

// TODO(TICKET-ADV122): wrap each page import in React.lazy() so Vite emits a
// separate chunk per route. The <Suspense> fallback below shows while the
// chunk downloads.
const Dashboard = lazy(() => import('@pages/Dashboard.jsx'));
const Trades    = lazy(() => import('@pages/Trades.jsx'));
const AddTrade  = lazy(() => import('@pages/AddTrade.jsx'));
const Login     = lazy(() => import('@pages/Login.jsx'));

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <h1>ReconX</h1>
          {user && (
            <nav className="layout__nav">
              <Link to="/">Dashboard</Link>
              <Link to="/trades">Trades</Link>
              <Link to="/trades/new">Add trade</Link>
            </nav>
          )}
        </div>
        {user && (
          <button onClick={handleLogout} style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>Logout</button>
        )}
      </header>
      <main className="layout__main">
        <Suspense fallback={<div className="loader">Loading…</div>}>
          <Routes>
            <Route path="/login"      element={<Login />} />
            <Route path="/"           element={<Dashboard />} />
            <Route path="/trades"     element={<Trades />} />
            <Route path="/trades/new" element={<AddTrade />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default withErrorBoundary(App);
