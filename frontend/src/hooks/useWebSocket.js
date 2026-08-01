import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url, { reconnect = true, maxRetries = 5 } = {}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef(null);
  const retries = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = null;

    function connect() {
      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen    = () => { if (!cancelled) { setStatus('open'); retries.current = 0; } };
      ws.onmessage = (e) => { if (!cancelled) { try { setData(JSON.parse(e.data)); } catch { setData(e.data); } } };
      ws.onerror   = () => { if (!cancelled) setStatus('error'); };
      ws.onclose   = () => {
        if (cancelled) return;
        setStatus('closed');
        if (reconnect && retries.current < maxRetries) {
          const delay = Math.min(30000, 500 * 2 ** retries.current++);
          timeoutId = setTimeout(connect, delay);
        }
      };
    }
    connect();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (wsRef.current) wsRef.current.close();
    };
  }, [url, reconnect, maxRetries]);

  const send = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
  };

  return { data, status, send };
}
