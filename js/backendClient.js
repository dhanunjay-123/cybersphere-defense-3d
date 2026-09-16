/* =========================================================
   backendClient.js
   CYBERSPHERE DEFENSE 3D — Python Backend Bridge
   Connects to FastAPI WebSocket (ws://localhost:8000/ws/score)
   for scikit-learn IsolationForest scoring.
   Gracefully falls back to in-browser ML if backend is offline.
   ========================================================= */

const BackendClient = (() => {

  const URL = `ws://${window.location.hostname || '127.0.0.1'}:8000/ws/score`;
  let socket = null;
  let connected = false;
  let reconnectTimer = null;

  function connect() {
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      socket = new WebSocket(URL);
    } catch (e) {
      connected = false;
      scheduleReconnect();
      return;
    }

    socket.addEventListener('open', () => {
      connected = true;
      clearTimeout(reconnectTimer);
      if (window.UI) UI.setMLBackendStatus(true);
      if (window.UI) UI.logEvent('Connected to Python ML backend (scikit-learn Isolation Forest)', 'info');
    });

    socket.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (typeof msg.anomaly_score === 'number' && window.MLEngine) {
          MLEngine.onBackendScore(msg.anomaly_score);
        }
      } catch (e) { /* ignore parse error */ }
    });

    socket.addEventListener('close', () => {
      if (connected) {
        if (window.UI) UI.setMLBackendStatus(false);
      }
      connected = false;
      scheduleReconnect();
    });

    socket.addEventListener('error', () => {
      connected = false;
      // error is immediately followed by close event
    });
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      connect();
    }, 8000);
  }

  function requestScore(normalizedVector) {
    if (!connected || !socket || socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(JSON.stringify({ features: normalizedVector }));
    } catch (e) { /* ignore send error */ }
  }

  function isConnected() {
    return connected;
  }

  return { connect, requestScore, isConnected };
})();

window.BackendClient = BackendClient;
