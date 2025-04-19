// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';

export default function useWebSocket(url, onMessage) {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };
    ws.current.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        onMessage(msg);
      } catch {
        console.error('Message parse error', e.data);
      }
    };
    ws.current.onclose = e => {
      console.log('WebSocket connection closed', e);
    };
    ws.current.onerror = e => {
      console.error('WebSocket error', e);
    };

    return () => {
      ws.current.close();
    };
  }, [url, onMessage]);

  // Mesaj gönderme fonksiyonunu expose ediyoruz
  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.error('WebSocket is not ready (state:', ws.current.readyState, ')');
    }
  }, []);

  return sendMessage;
}
