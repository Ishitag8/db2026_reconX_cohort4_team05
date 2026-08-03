// useMemo for portfolio-value calc.
// useTradeStream live feed.
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
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div role="status" aria-live="polite" style={{ fontSize: '13px', opacity: 0.8 }}>
          SSE: {isConnected ? 'connected' : 'disconnected'}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Portfolio value (USD)" value={portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <StatCard label="Trades streamed" value={trades.length} />
        <StatCard label="Matched" value={matched} />
        <StatCard label="Open breaks" value={breaks} />
      </div>

      <section aria-labelledby="feed">
        <h2 id="feed" style={{ fontSize: '18px', margin: '0 0 var(--space-2)' }}>Live trade feed</h2>
        <div id="trade-feed" role="status" aria-live="polite" aria-atomic="false">
          {trades.length === 0 ? (
            <p>Waiting for live trades...</p>
          ) : (
            trades.map((t) => {
              const sym = t.instrumentSymbol || t.symbol || 'Unknown';
              let currency = '$';
              if (sym.endsWith('.DE')) {
                currency = '€';
              } else if (sym.endsWith('.NS')) {
                currency = '₹';
              }

              const qty = t.quantity !== undefined ? t.quantity : t.qty || 0;
              const formattedQty = Number(qty).toLocaleString();
              const formattedPrice = currency + Number(t.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
              const calculatedNotional = Number(qty) * Number(t.price || 0);
              const formattedNotional = currency + calculatedNotional.toLocaleString(undefined, { minimumFractionDigits: 2 });

              const sideClass = t.side === 'BUY' ? 'trade-badge--buy' : 'trade-badge--sell';

              return (
                <article key={t.id || t.tradeRef} className={`trade-card trade-card--${String(t.status || 'pending').toLowerCase()}`} style={{ marginBottom: 'var(--space-2)' }}>
                  <div className="trade-card__header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <strong className="trade-card__ref">{t.tradeRef}</strong>
                    <span className="trade-card__symbol" style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{sym}</span>
                    <span className={`trade-badge ${sideClass}`} style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#fff',
                      backgroundColor: t.side === 'BUY' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>{t.side}</span>
                    <span className="trade-card__status" style={{ marginLeft: 'auto', fontWeight: 'bold', fontSize: '12px' }}>{t.status}</span>
                  </div>
                  <div className="trade-card__details" style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '13px', opacity: 0.9 }}>
                    <span className="trade-card__detail">Qty: <strong>{formattedQty}</strong></span>
                    <span className="trade-card__detail">Price: <strong>{formattedPrice}</strong></span>
                    <span className="trade-card__detail trade-card__detail--total">Total Value: <strong>{formattedNotional}</strong></span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}

export default withAuth(Dashboard);