/* =========================================================
   mlEvaluation.js
   Builds a synthetic labeled dataset (NORMAL / ANOMALOUS),
   classifies every sample with the SAME Isolation Forest the
   live app uses, and computes real classification metrics.
   Detection latency is pulled from HeadlessSim's ransomware
   scenario runs (the same math Experiment Mode uses) so it
   reflects an actual simulated timeline, not a fixed constant.
   ========================================================= */

const MLEvaluation = (() => {

  const SAMPLES_PER_CLASS = 120;

  function syntheticNormalFeatures() {
    const n = () => (Math.random() + Math.random() - 1);
    return {
      files_accessed_per_minute: Math.max(0, 8 + n() * 3),
      directory_changes: Math.max(0, 3 + n() * 1.5),
      file_modifications: Math.max(0, 4 + n() * 2),
      traversal_speed: Math.max(0, 6 + n() * 3),
      unique_extensions: Math.max(0, 2 + Math.round(n())),
      behavior_deviation: Math.max(0, 5 + n() * 3),
      process_activity: Math.max(0, 4 + n() * 3),
      decoy_interaction: 0
    };
  }

  function syntheticAnomalousFeatures() {
    // Sampled across the "progress" of a simulated attack (t in (0.2, 1])
    // so the anomalous class covers early, mid and late-stage behavior.
    const t = 0.2 + Math.random() * 0.8;
    return {
      files_accessed_per_minute: Math.round(8 + t * 140),
      directory_changes: Math.round(3 + t * 30),
      file_modifications: t > 0.4 ? 90 : 60,
      traversal_speed: Math.round(6 + t * 90),
      unique_extensions: Math.min(8, 2 + Math.round(t * 5)),
      behavior_deviation: Math.min(98, Math.round(4 + t * 92)),
      process_activity: Math.round(55 + t * 40),
      decoy_interaction: Math.random() < 0.5 ? 100 : 0
    };
  }

  function run() {
    if (!MLEngine.isReady()) MLEngine.train();

    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < SAMPLES_PER_CLASS; i++) {
      const raw = syntheticNormalFeatures();
      const vec = Config.FEATURE_ORDER.map(k => Config.normalize(k, raw[k]));
      const predicted = MLEngine.classify(MLEngine.scoreVector(vec));
      if (predicted === 'NORMAL') tn++; else fp++;
    }

    for (let i = 0; i < SAMPLES_PER_CLASS; i++) {
      const raw = syntheticAnomalousFeatures();
      const vec = Config.FEATURE_ORDER.map(k => Config.normalize(k, raw[k]));
      const predicted = MLEngine.classify(MLEngine.scoreVector(vec));
      if (predicted === 'ANOMALOUS') tp++; else fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;

    // Detection latency: reuse the ransomware scenarios from
    // HeadlessSim, which run the exact same fused scoring.
    const scenarios = ['ransomware_fast', 'ransomware_slow', 'ransomware_no_decoy'];
    const latencies = scenarios
      .map(k => HeadlessSim.runScenario(k))
      .filter(r => r.detected)
      .map(r => r.detectionSeconds);
    const avgLatency = latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

    return {
      samplesPerClass: SAMPLES_PER_CLASS,
      confusion: { tp, fp, tn, fn },
      precision: pct(precision),
      recall: pct(recall),
      f1: pct(f1),
      falsePositiveRate: pct(fpr),
      detectionRate: pct(recall),
      avgDetectionLatency: avgLatency != null ? `${Math.round(avgLatency * 10) / 10}s` : 'N/A (no run crossed threshold)'
    };
  }

  function pct(x) { return `${Math.round(x * 1000) / 10}%`; }

  return { run };
})();

window.MLEvaluation = MLEvaluation;
