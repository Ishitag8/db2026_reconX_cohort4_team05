// TICKET-ADV122 — Lazy + Suspense for route-based code splitting
import React, { Suspense, lazy } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { withErrorBoundary } from '@components/withErrorBoundary.jsx';

// TODO(TICKET-ADV122): wrap each page import in React.lazy() so Vite emits a
// separate chunk per route. The <Suspense> fallback below shows while the
// chunk downloads.
const Dashboard = lazy(() => import('@pages/Dashboard.jsx'));
const Trades    = lazy(() => import('@pages/Trades.jsx'));
const AddTrade  = lazy(() => import('@pages/AddTrade.jsx'));
const Login     = lazy(() => import('@pages/Login.jsx'));

import { useTheme } from '@context/ThemeContext.jsx';
import { useAuth } from '@context/AuthContext.jsx';

function App() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const showSidebar = user !== null;

  return (
    <div className={showSidebar ? "layout layout--with-sidebar" : "layout"}>
      {showSidebar && (
        <aside className="layout__sidebar">
          <div className="sidebar__brand">
            <h2>ReconX</h2>
            <span>Enterprise Portal</span>
          </div>
          <nav className="sidebar__nav">
            <NavLink to="/">📊 Dashboard</NavLink>
            <NavLink to="/trades" end>💼 Trades</NavLink>
            <NavLink to="/trades/new">➕ Add Trade</NavLink>
          </nav>
          <div className="sidebar__footer">
            <button onClick={logout} className="sign-out-btn">
              🚪 Sign Out
            </button>
            <button onClick={toggle} className="theme-toggle-btn">
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
        </aside>
      )}
      <div className="layout__content">
        {showSidebar && (
          <header className="layout__header">
            <div className="user-profile">
              Current Role: <span className="role-badge">{user.role}</span>
            </div>
          </header>
        )}
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
    </div>
  );
}

export default withErrorBoundary(App);
