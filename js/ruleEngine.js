/* =========================================================
   ruleEngine.js
   The rule-based detector: eight hand-authored behavioral
   indicators (0-100 each), combined with fixed weights into a
   single RULE ENGINE score. This is deliberately kept simple
   and explainable — it is NOT the ML layer (see mlEngine.js).
   Threat Fusion (threatFusion.js) combines this with the ML
   score, decoy signal, and path anomaly into the final score.
   ========================================================= */

const RuleEngine = (() => {

  const WEIGHTS = {
    accessFrequency: 0.14,
    modificationFrequency: 0.12,
    traversalSpeed: 0.14,
    filesTouched: 0.10,
    unusualExtensions: 0.08,
    behaviorDeviation: 0.14,
    decoyInteraction: 0.20,
    processSuspicion: 0.08
  };

  let indicators = zeroIndicators();
  let score = 0;

  function zeroIndicators() {
    return {
      accessFrequency: 0, modificationFrequency: 0, traversalSpeed: 0,
      filesTouched: 0, unusualExtensions: 0, behaviorDeviation: 0,
      decoyInteraction: 0, processSuspicion: 0
    };
  }

  function setIndicator(key, value) {
    if (!(key in indicators)) return;
    indicators[key] = Math.max(0, Math.min(100, value));
    recompute();
  }

  function bumpIndicator(key, amount) {
    setIndicator(key, (indicators[key] || 0) + amount);
  }

  function recompute() {
    let total = 0;
    Object.keys(WEIGHTS).forEach(k => { total += (indicators[k] || 0) * WEIGHTS[k]; });
    score = Math.round(Math.max(0, Math.min(100, total)));
  }

  function decay(amount = 1.2) {
    Object.keys(indicators).forEach(k => { indicators[k] = Math.max(0, indicators[k] - amount); });
    recompute();
  }

  function getScore() { return score; }
  function getIndicators() { return { ...indicators }; }
  function getWeights() { return { ...WEIGHTS }; }

  function reset() {
    indicators = zeroIndicators();
    score = 0;
  }

  return { setIndicator, bumpIndicator, decay, getScore, getIndicators, getWeights, reset };
})();

window.RuleEngine = RuleEngine;
