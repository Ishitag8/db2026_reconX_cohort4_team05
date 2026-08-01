// TICKET-ADV120 — useMemo for portfolio-value calc.
// TICKET-ADV116 — useTradeStream live feed.
import React, { useMemo } from 'react';
import { withAuth } from '@components/withAuth.jsx';
import { useTradeStream } from '@hooks/useTradeStream.js';

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

  const portfolioValue = useMemo(
    () => trades.reduce((sum, t) => sum + ((t.quantity !== undefined ? t.quantity : t.qty || 0) * (t.price || 0)), 0),
    [trades]
  );

  const matched = useMemo(
    () => trades.filter((t) => t.status === 'MATCHED').length,
    [trades]
  );

  const breaks = useMemo(
    () => trades.filter((t) => ['UNMATCHED', 'DISPUTED', 'BREAK'].includes(t.status)).length,
    [trades]
  );

  return (
    <section>
      <div className="section-header">
        <h2>Dashboard</h2>
        <div className={`connection-badge ${isConnected ? 'live' : 'offline'}`} role="status" aria-live="polite">
          <span className="indicator-dot"></span>
          SSE: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <div className="stat-grid">
        <StatCard label="Portfolio value (USD)" value={portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <StatCard label="Trades streamed" value={trades.length} />
        <StatCard label="Matched" value={matched} />
        <StatCard label="Open breaks" value={breaks} />
      </div>
    </section>
  );
}

export default withAuth(Dashboard);
