/* =========================================================
   events.js
   Central EventBus providing a decoupled publish-subscribe
   architecture across all simulation, detection, decoy,
   telemetry, 3D visualization, and UI modules.
   ========================================================= */

const EventBus = (() => {
  const listeners = {};
  const history = [];
  const MAX_HISTORY = 300;

  // Recognized core event types
  const Events = {
    FILE_ACCESSED:        'FILE_ACCESSED',
    DIRECTORY_ENTERED:    'DIRECTORY_ENTERED',
    FILE_MODIFIED:        'FILE_MODIFIED',
    FEATURES_UPDATED:     'FEATURES_UPDATED',
    ANOMALY_DETECTED:     'ANOMALY_DETECTED',
    THREAT_SCORE_UPDATED: 'THREAT_SCORE_UPDATED',
    DECOY_RECOMMENDED:    'DECOY_RECOMMENDED',
    DECOY_DEPLOYED:       'DECOY_DEPLOYED',
    DECOY_ACCESSED:       'DECOY_ACCESSED',
    RANSOMWARE_DETECTED:  'RANSOMWARE_DETECTED',
    INCIDENT_CONTAINED:   'INCIDENT_CONTAINED',
    STAGE_CHANGED:        'STAGE_CHANGED',
    SIMULATION_RESET:     'SIMULATION_RESET',
    PROCESS_MOVED:        'PROCESS_MOVED',
    SHIELD_STATE_CHANGED: 'SHIELD_STATE_CHANGED'
  };

  function on(eventName, callback) {
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(callback);
    return () => off(eventName, callback);
  }

  function off(eventName, callback) {
    if (!listeners[eventName]) return;
    listeners[eventName] = listeners[eventName].filter(cb => cb !== callback);
  }

  function emit(eventName, data = {}) {
    const eventObj = {
      type: eventName,
      data,
      timestamp: performance.now(),
      wallTime: new Date().toLocaleTimeString('en-GB', { hour12: false })
    };

    history.push(eventObj);
    if (history.length > MAX_HISTORY) history.shift();

    if (listeners[eventName]) {
      listeners[eventName].forEach(callback => {
        try {
          callback(data, eventObj);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${eventName}:`, err);
        }
      });
    }

    // Also support a wildcard listener
    if (listeners['*']) {
      listeners['*'].forEach(callback => {
        try {
          callback(eventObj);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard listener:`, err);
        }
      });
    }
  }

  function getHistory() {
    return [...history];
  }

  function clearHistory() {
    history.length = 0;
  }

  return {
    Events,
    on,
    off,
    emit,
    getHistory,
    clearHistory
  };
})();

window.EventBus = EventBus;
