import { WebSocketServer, WebSocket } from 'ws';

let wssInstance = null;

export const initWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wssInstance = wss;

  wss.on('connection', (ws, req) => {
    console.log('[WebSocket] Client connected from', req.socket.remoteAddress);

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Send initial greeting
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to VibeSafe Real-time Emergency Stream',
      timestamp: new Date().toISOString()
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        // Ignore malformed ping
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err.message);
    });
  });

  // Keep-alive heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
};

// Broadcast payload to all connected dashboard clients
export const broadcastEvent = (eventType, payload) => {
  if (!wssInstance) return;

  const message = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
