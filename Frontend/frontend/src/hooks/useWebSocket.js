import { useEffect, useRef, useCallback } from 'react';
import { getToken } from '../services/api';

const WS_URL = 'ws://localhost:8000/ws/dashboard/';
const RECONNECT_DELAY_MS = 3000;

export function useWebSocket(onMessage) {
  const wsRef       = useRef(null);
  const timerRef    = useRef(null);
  const mountedRef  = useRef(true);
  const onMsgRef    = useRef(onMessage);
  onMsgRef.current  = onMessage;

  const connect = useCallback(() => {
    const token = getToken();
    if (!token || !mountedRef.current) return;

    const url = `${WS_URL}?token=${token}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMsgRef.current?.(data);
      } catch { /* ignore malformed frame */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
