// TICKET-ADV120 — useMemo for portfolio-value calc.
// TICKET-ADV116 — useTradeStream live feed.
import React, { useMemo, useEffect, useState } from 'react';
import { withAuth } from '@components/withAuth.jsx';
import { useTradeStream } from '@hooks/useTradeStream.js';
import { useToast } from '@context/ToastContext.jsx';
import { api } from '@services/apiService.js';
import { LayoutDashboard, ReceiptText, PlusCircle, RefreshCw } from 'lucide-react';

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <h3>{label}</h3>
      <p>{value}</p>
    </article>
  );
}

function Dashboard() {
  const { trades, isConnected } = useTradeStream();
  const { success: triggerToastSuccess } = useToast();

  const [stats, setStats] = useState({
    totalPortfolioValue: 0,
    totalTrades: 0,
    matchedTrades: 0,
    openBreaks: 0
  });

  useEffect(() => {
    const successMsg = sessionStorage.getItem('reconx-login-success');
    if (successMsg) {
      triggerToastSuccess('Login successful! Welcome to ReconX.');
      sessionStorage.removeItem('reconx-login-success');
    }
  }, [triggerToastSuccess]);

  useEffect(() => {
    let active = true;
    api.getStats()
      .then(res => {
        if (active && res) {
          setStats(res);
        }
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('Failed to load dashboard stats:', err);
      });
    return () => {
      active = false;
    };
  }, [trades]);

  const averageTradeValue = useMemo(() => {
    if (stats.totalTrades === 0) return 0;
    return stats.totalPortfolioValue / stats.totalTrades;
  }, [stats.totalTrades, stats.totalPortfolioValue]);

  const recentTrades = useMemo(() => trades.slice(0, 4), [trades]);

  const topStatus = useMemo(() => {
    if (stats.totalTrades === 0) return 'No activity yet';
    if (stats.matchedTrades >= stats.openBreaks) return 'Matched flow leading';
    return 'Open breaks require attention';
  }, [stats.totalTrades, stats.matchedTrades, stats.openBreaks]);

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Enterprise trade operations at a glance with live stream activity and desk health.</p>
        </div>
        <div className={`connection-badge ${isConnected ? 'live' : 'offline'}`} role="status" aria-live="polite">
          <span className="indicator-dot"></span>
          SSE: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <div className="stat-grid dashboard-hero-grid">
        <StatCard label="Portfolio value (USD)" value={stats.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <StatCard label="Total Trades" value={stats.totalTrades} />
        <StatCard label="Matched" value={stats.matchedTrades} />
        <StatCard label="Open breaks" value={stats.openBreaks} />
      </div>

      <div className="dashboard-split">
        <section className="page-card dashboard-insight-card">
          <div className="section-card__header section-card__header--tight">
            <div>
              <h2>Desk Snapshot</h2>
              <p>Quick operational context for the trading desk.</p>
            </div>
          </div>

          <div className="dashboard-insight-grid">
            <article className="dashboard-insight">
              <LayoutDashboard size={18} strokeWidth={2.2} />
              <div>
                <span>Workspace status</span>
                <strong>{topStatus}</strong>
              </div>
            </article>

            <article className="dashboard-insight">
              <ReceiptText size={18} strokeWidth={2.2} />
              <div>
                <span>Average trade value</span>
                <strong>{averageTradeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </article>

            <article className="dashboard-insight">
              <RefreshCw size={18} strokeWidth={2.2} />
              <div>
                <span>Live refresh</span>
                <strong>{isConnected ? 'Streaming' : 'Offline'}</strong>
              </div>
            </article>

            <article className="dashboard-insight">
              <PlusCircle size={18} strokeWidth={2.2} />
              <div>
                <span>Next action</span>
                <strong>{stats.openBreaks > 0 ? 'Review breaks' : 'Capture new trade'}</strong>
              </div>
            </article>
          </div>
        </section>

        <section className="page-card dashboard-activity-card">
          <div className="section-card__header section-card__header--tight">
            <div>
              <h2>Recent Stream</h2>
              <p>Latest desk activity from the live SSE feed.</p>
            </div>
          </div>

          <div className="dashboard-activity-list">
            {recentTrades.length === 0 ? (
              <div className="dashboard-empty-state">Waiting for stream activity.</div>
            ) : recentTrades.map((trade) => (
              <div key={trade.id} className="dashboard-activity-item">
                <div>
                  <strong>{trade.tradeRef}</strong>
                  <span>{trade.instrumentSymbol || trade.symbol || 'Unknown symbol'}</span>
                </div>
                <span className={`status-pill ${String(trade.status || 'pending').toLowerCase()}`}>
                  {trade.status || 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default withAuth(Dashboard);
