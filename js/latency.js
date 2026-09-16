/* =========================================================
   latency.js
   Tracks real timestamps through the detection timeline:
   Simulation Start -> First Anomaly -> Decoy Access -> Detection.
   All values are wall-clock deltas from actual events firing
   during the current run — nothing here is a fixed/fake number.
   ========================================================= */

const LatencyTracker = (() => {

  let t = { start: null, firstAnomaly: null, decoyAccess: null, detected: null };

  function markStart() { t.start = performance.now(); }
  function markFirstAnomaly() { if (t.start && !t.firstAnomaly) t.firstAnomaly = performance.now(); }
  function markDecoyAccess() { if (t.start && !t.decoyAccess) t.decoyAccess = performance.now(); }
  function markDetected() { if (t.start && !t.detected) t.detected = performance.now(); }

  function seconds(from, to) {
    if (from == null || to == null) return null;
    return Math.round(((to - from) / 1000) * 10) / 10;
  }

  function getSummary() {
    return {
      toFirstAnomaly: seconds(t.start, t.firstAnomaly),
      toDecoyAccess: seconds(t.start, t.decoyAccess),
      toDetection: seconds(t.start, t.detected)
    };
  }

  function reset() {
    t = { start: null, firstAnomaly: null, decoyAccess: null, detected: null };
  }

  return { markStart, markFirstAnomaly, markDecoyAccess, markDetected, getSummary, reset };
})();

window.LatencyTracker = LatencyTracker;
