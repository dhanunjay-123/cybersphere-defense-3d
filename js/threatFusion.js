/* =========================================================
   threatFusion.js
   Combines four independently-computed signals into one
   Final Threat Score:
     RULE ENGINE   — weighted behavioral indicators (ruleEngine.js)
     ML ANOMALY    — Isolation Forest score (mlEngine.js)
     DECOY SIGNAL  — was a virtual decoy file touched at all
     PATH ANOMALY  — how abnormal the traversal pattern is

   All weights live in config.js so the fusion is auditable
   and easy to re-tune without touching this logic.
   ========================================================= */

const ThreatFusion = (() => {

  function compute({ ruleScore, mlScore, decoySignalScore, pathAnomalyScore }) {
    const w = Config.FUSION_WEIGHTS;
    const finalScore = Math.round(
      ruleScore * w.ruleEngine +
      mlScore * w.mlAnomaly +
      decoySignalScore * w.decoySignal +
      pathAnomalyScore * w.pathAnomaly
    );
    return Math.max(0, Math.min(100, finalScore));
  }

  return { compute };
})();

window.ThreatFusion = ThreatFusion;
