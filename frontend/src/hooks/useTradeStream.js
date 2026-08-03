import { useEffect, useState } from 'react';
import { api } from '@services/apiService.js';

export function useTradeStream(url = '/api/v1/trades/stream') {
  const [trades, setTrades] = useState([]);
  const [isConnected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    api.listTrades('?size=200')
      .then(res => {
        if (active && res && res.items) {
          setTrades(res.items);
        }
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('Failed to load initial trades for stream:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const sse = new EventSource(url);
    sse.onopen = () => setConnected(true);
    sse.onmessage = (e) => {
      try {
        const t = JSON.parse(e.data);
        setTrades((prev) => {
          const idx = prev.findIndex(item => item.id === t.id);
          if (idx > -1) {
            const updated = [...prev];
            updated[idx] = t;
            return updated;
          }
          return [t, ...prev].slice(0, 200);
        });
      } catch { /* ignore malformed payload */ }
    };
    sse.onerror = () => setConnected(false);
    return () => sse.close();
  }, [url]);

  return { trades, isConnected };
}
