import { useEffect, useRef, useCallback } from 'react';
import { getToken } from '../services/api';

const WS_URL = 'ws://localhost:8000/ws/dashboard/';

export function useWebSocket(onMessage) {
  const wsRef      = useRef(null);
  const timerRef   = useRef(null);
  const mountedRef = useRef(true);
  const onMsgRef   = useRef(onMessage);
  const retryRef   = useRef(0);
  onMsgRef.current = onMessage;

  const connect = useCallback(() => {
    const token = getToken();
    if (!token || !mountedRef.current) return;

    const url = `${WS_URL}?token=${token}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { retryRef.current = 0; };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMsgRef.current?.(data);
      } catch { /* ignore malformed frame */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      // Exponential back-off: 1s, 2s, 4s, 8s … capped at 30s
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    };

    // onerror is always followed by onclose — no need to call ws.close() here.
    // Calling close() on a CONNECTING socket causes a browser warning.
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      const ws = wsRef.current;
      if (!ws) return;
      if (ws.readyState === WebSocket.CONNECTING) {
        // Don't close mid-handshake — wait for open then close silently.
        ws.onopen  = () => ws.close();
        ws.onclose = null;
      } else {
        ws.close();
      }
    };
  }, [connect]);
}
