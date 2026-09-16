/* =========================================================
   explainability.js
   CYBERSPHERE DEFENSE 3D — Explainable AI (XAI) Engine
   Computes transparent reasons for threat detection directly
   from live thresholds, baseline comparisons, and tripwires.
   ========================================================= */

const Explainability = (() => {

  function build({ indicators = {}, metrics = {}, baseline = {}, mlScore = 0, mlClassification = 'NORMAL', decoyTriggered = false }) {
    const bFiles = baseline.filesPerMin || 8;
    const bDirs = baseline.dirChangesPerMin || 3;
    const curFiles = metrics.filesPerMin || 8;
    const curDirs = metrics.dirChangesPerMin || 3;

    return [
      {
        id: 'access_rate',
        label: 'Rapid file access rate',
        detail: `${curFiles} files/min (baseline: ${bFiles})`,
        active: curFiles > bFiles * 2.5
      },
      {
        id: 'dir_traversal',
        label: 'High directory traversal frequency',
        detail: `${curDirs} dirs/min (baseline: ${bDirs})`,
        active: curDirs > bDirs * 2.5
      },
      {
        id: 'modification_rate',
        label: 'High file modification activity',
        detail: `Rate: ${metrics.modRate || 'Low'}`,
        active: metrics.modRate === 'HIGH' || metrics.modRate === 'VERY HIGH'
      },
      {
        id: 'extensions',
        label: 'Unusual extension diversity',
        detail: (indicators.unusualExtensions || 0) > 0 ? 'Multiple extension changes' : 'Standard work files',
        active: (indicators.unusualExtensions || 0) > 0
      },
      {
        id: 'behavior_dev',
        label: 'Behavioral deviation from normal baseline',
        detail: `Deviation: ${Math.round(indicators.behaviorDeviation || metrics.anomaly || 0)}%`,
        active: (indicators.behaviorDeviation || 0) > 35 || (metrics.anomaly || 0) > 35
      },
      {
        id: 'ml_anomaly',
        label: 'Isolation Forest ML anomaly detected',
        detail: `Score: ${mlScore}% (${mlClassification})`,
        active: mlClassification === 'ANOMALOUS' || mlScore >= 50
      },
      {
        id: 'decoy_access',
        label: 'Adaptive decoy file accessed (Tripwire)',
        detail: decoyTriggered ? 'CRITICAL: Decoy breached' : 'Decoy unaccessed',
        active: decoyTriggered || (indicators.decoyInteraction || 0) >= 80
      }
    ];
  }

  return { build };
})();

window.Explainability = Explainability;
