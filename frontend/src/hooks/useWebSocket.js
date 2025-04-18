// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';

export default function useWebSocket(url, onMessage) {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket bağlantısı açıldı');
    };
    ws.current.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        onMessage(msg);
      } catch {
        console.error('Mesaj parse hatası', e.data);
      }
    };
    ws.current.onclose = e => {
      console.log('WebSocket kapandı', e);
    };
    ws.current.onerror = e => {
      console.error('WebSocket hatası', e);
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
      console.error('WebSocket hazır değil (state:', ws.current.readyState, ')');
    }
  }, []);

  return sendMessage;
}
