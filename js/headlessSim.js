/* =========================================================
   headlessSim.js
   Generates synthetic behavior sequences and scores every tick
   through the real scoring pipeline (RuleEngine weights, the
   already-trained Isolation Forest, ThreatFusion) WITHOUT
   touching the 3D scene, DOM, or the live app's own RuleEngine
   state. This is what powers Experiment Mode (section 16) and
   ML Evaluation (section 17) — every number produced comes from
   actually running the detection math against a scenario, never
   a hard-coded result.
   ========================================================= */

const HeadlessSim = (() => {

  const SCENARIOS = {
    normal: { label: 'Normal user', steps: 30, attack: false },
    ransomware_fast: { label: 'Ransomware (fast)', steps: 10, attack: true, decoyAtStep: 6 },
    ransomware_slow: { label: 'Ransomware (slow / stealthy)', steps: 28, attack: true, decoyAtStep: 24 },
    ransomware_no_decoy: { label: 'Ransomware (avoids decoy)', steps: 16, attack: true, decoyAtStep: null }
  };

  const TICK_SECONDS = 0.4; // mirrors RansomwareSimulation's fastest step cadence

  function noise(scale = 1) {
    return (Math.random() + Math.random() - 1) * scale;
  }

  // Produces the raw 8-feature vector for one tick of a scenario.
  function featuresAtStep(scenario, step) {
    if (!scenario.attack) {
      return {
        files_accessed_per_minute: Math.max(0, 8 + noise(2)),
        directory_changes: Math.max(0, 3 + noise(1)),
        file_modifications: Math.max(0, 4 + noise(2)),
        traversal_speed: Math.max(0, 6 + noise(2)),
        unique_extensions: 2,
        behavior_deviation: Math.max(0, 5 + noise(3)),
        process_activity: 0,
        decoy_interaction: 0
      };
    }
    const t = Math.min(1, step / Math.max(1, scenario.steps - 1));
    const decoyHit = scenario.decoyAtStep !== null && step >= scenario.decoyAtStep;
    return {
      files_accessed_per_minute: Math.round(8 + t * 140),
      directory_changes: Math.round(3 + t * 30),
      file_modifications: t > 0.4 ? 90 : 60,
      traversal_speed: Math.round(6 + t * 90),
      unique_extensions: Math.min(8, 2 + Math.round(t * 5)),
      behavior_deviation: Math.min(98, Math.round(4 + t * 92)),
      process_activity: Math.round(55 + t * 40),
      decoy_interaction: decoyHit ? 100 : 0
    };
  }

  // Maps raw features onto the same 8 rule-engine indicators the
  // live app uses, so the rule score is computed the same way.
  function indicatorsFromFeatures(raw, cumulativeFilesTouched) {
    return {
      accessFrequency: Math.min(100, raw.files_accessed_per_minute * 0.7),
      modificationFrequency: Math.min(100, raw.file_modifications),
      traversalSpeed: Math.min(100, raw.traversal_speed),
      filesTouched: Math.min(100, cumulativeFilesTouched),
      unusualExtensions: raw.unique_extensions > 4 ? Math.min(100, (raw.unique_extensions - 2) * 15) : 0,
      behaviorDeviation: Math.min(100, raw.behavior_deviation),
      decoyInteraction: raw.decoy_interaction,
      processSuspicion: raw.process_activity
    };
  }

  function scoreTick(raw, indicators) {
    const weights = RuleEngine.getWeights();
    let ruleScore = 0;
    Object.keys(weights).forEach(k => { ruleScore += (indicators[k] || 0) * weights[k]; });
    ruleScore = Math.round(Math.max(0, Math.min(100, ruleScore)));

    const normalizedVector = Config.FEATURE_ORDER.map(k => Config.normalize(k, raw[k]));
    const mlScore = MLEngine.isReady() ? MLEngine.scoreVector(normalizedVector) : (MLEngine.train(), MLEngine.scoreVector(normalizedVector));

    const pathAnomalyScore = Math.round(Math.min(100, indicators.traversalSpeed * 0.7 + indicators.filesTouched * 0.5));
    const decoySignalScore = indicators.decoyInteraction;

    const finalScore = ThreatFusion.compute({ ruleScore, mlScore, decoySignalScore, pathAnomalyScore });
    return { ruleScore, mlScore, pathAnomalyScore, decoySignalScore, finalScore };
  }

  // Runs one scenario tick-by-tick and returns the full trace plus
  // a summary (final scores, whether/when it crossed the detection
  // threshold, and whether the decoy was ever touched).
  function runScenario(scenarioKey) {
    const scenario = SCENARIOS[scenarioKey];
    const trace = [];
    let cumulativeFiles = 0;
    let detectedAtStep = null;
    let decoyTouched = false;

    for (let step = 0; step < scenario.steps; step++) {
      const raw = featuresAtStep(scenario, step);
      if (scenario.attack) cumulativeFiles += 4;
      if (raw.decoy_interaction >= 100) decoyTouched = true;

      const indicators = indicatorsFromFeatures(raw, cumulativeFiles);
      const result = scoreTick(raw, indicators);
      trace.push({ step, raw, indicators, ...result });

      if (detectedAtStep === null && result.finalScore >= Config.DETECTION_THRESHOLD) {
        detectedAtStep = step;
      }
    }

    const last = trace[trace.length - 1];
    const peakML = Math.max(...trace.map(t => t.mlScore));
    const peakThreat = Math.max(...trace.map(t => t.finalScore));

    return {
      scenarioKey,
      label: scenario.label,
      isAttack: scenario.attack,
      trace,
      finalMLScore: last.mlScore,
      peakMLScore: peakML,
      finalThreatScore: last.finalScore,
      peakThreatScore: peakThreat,
      decoyTouched,
      detected: detectedAtStep !== null,
      detectionStep: detectedAtStep,
      detectionSeconds: detectedAtStep !== null ? Math.round(detectedAtStep * TICK_SECONDS * 10) / 10 : null
    };
  }

  return { SCENARIOS, runScenario, TICK_SECONDS };
})();

window.HeadlessSim = HeadlessSim;
