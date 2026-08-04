// useTradeStream() — SSE subscription returning live trades.
import { useEffect, useState } from 'react';

const MAX_BUFFER = 200;

export function useTradeStream(url = '/api/v1/trades/stream') {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = sessionStorage.getItem('reconx-session-trades');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isConnected, setConnected] = useState(false);

  useEffect(() => {
    const sse = new EventSource(url);
    sse.onopen  = () => setConnected(true);
    sse.onerror = () => setConnected(false);
    sse.onmessage = (e) => {
      try {
        const trade = JSON.parse(e.data);
        
        const loginTimeStr = sessionStorage.getItem('reconx-login-time');
        if (loginTimeStr && trade.createdAt) {
          const loginTime = new Date(loginTimeStr).getTime();
          const tradeTime = new Date(trade.createdAt).getTime();
          if (tradeTime < loginTime) {
            return;
          }
        }

        setTrades((prev) => {
          if (prev.some((t) => t.id === trade.id || t.tradeRef === trade.tradeRef)) {
            return prev;
          }
          const next = [trade, ...prev].slice(0, MAX_BUFFER);
          sessionStorage.setItem('reconx-session-trades', JSON.stringify(next));
          return next;
        });
      } catch { /* ignore malformed payload */ }
    };
    return () => sse.close();
  }, [url]);

  return { trades, isConnected };
}