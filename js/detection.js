/* =========================================================
   detection.js
   CYBERSPHERE DEFENSE 3D — Central Detection Pipeline
   Orchestrates:
     Behavior Features -> Rule Engine + Isolation Forest
                       -> Threat Fusion (+ Decoy + Path Anomaly)
                       -> Early Detection & Incident Isolation
   ========================================================= */

const Detection = (() => {

  let finalScore = 0;
  let detected = false;
  let mlScore = 0;
  let mlClassification = 'NORMAL';
  let pathAnomalyScore = 0;

  function band(s) { return Config.bandFor(s).key; }
  function bandLabel(s) { return Config.bandFor(s).label; }

  function setIndicator(key, value) {
    RuleEngine.setIndicator(key, value);
    recompute();
  }

  function bumpIndicator(key, amount) {
    RuleEngine.bumpIndicator(key, amount);
    recompute();
  }

  function recompute() {
    const ruleScore = RuleEngine.getScore();
    const indicators = RuleEngine.getIndicators();

    // Dedicated path anomaly score from PathAnalysis module
    pathAnomalyScore = window.PathAnalysis ? PathAnalysis.getPathAnomalyScore() :
      Math.round(Math.min(100, (indicators.traversalSpeed || 0) * 0.7 + (indicators.filesTouched || 0) * 0.5));

    // Normalized 8-feature vector into Isolation Forest (or Python Backend)
    const normalizedVector = FeatureExtractor.getNormalizedVector();
    mlScore = MLEngine.evaluate(normalizedVector);
    mlClassification = MLEngine.classify(mlScore);

    // Decoy tripwire signal (0 or 100)
    const decoySignalScore = indicators.decoyInteraction || 0;

    // Fused score
    finalScore = ThreatFusion.compute({
      ruleScore,
      mlScore,
      decoySignalScore,
      pathAnomalyScore
    });

    // Track real performance latency marks
    if (finalScore > 18 && finalScore <= 60) LatencyTracker.markFirstAnomaly();
    if (decoySignalScore >= 80) LatencyTracker.markDecoyAccess();

    // Update UI components
    UI.updateThreatScore(finalScore, bandLabel(finalScore), band(finalScore));
    UI.updateThreatBreakdown({
      ruleScore,
      mlScore,
      mlClassification,
      decoyActive: decoySignalScore >= 80,
      pathAnomalyScore,
      finalScore
    });

    const explainChecks = Explainability.build({
      indicators,
      metrics: window.__lastBehaviorMetrics || BehaviorEngine.getMetrics(),
      baseline: BehaviorEngine.getBaseline(),
      mlScore,
      mlClassification,
      decoyTriggered: decoySignalScore >= 80
    });
    UI.updateExplainability(explainChecks);

    // Update 3D visual states
    SceneManager.setAICoreLevel(band(finalScore));

    if (finalScore >= 80 || decoySignalScore >= 80) {
      SceneManager.updateSecurityShield(decoySignalScore >= 80 ? 'decoy' : 'threat');
    } else if (finalScore >= 50) {
      SceneManager.updateSecurityShield('suspicious');
    } else {
      SceneManager.updateSecurityShield('normal');
    }

    if (window.EventBus) {
      EventBus.emit(EventBus.Events.THREAT_SCORE_UPDATED, {
        score: finalScore,
        band: band(finalScore),
        bandLabel: bandLabel(finalScore),
        ruleScore,
        mlScore,
        decoySignalScore,
        pathAnomalyScore
      });
    }

    // Check detection threshold
    if (finalScore >= Config.DETECTION_THRESHOLD && !detected) {
      detected = true;
      LatencyTracker.markDetected();
      onDetected(indicators);
    }
  }

  function onDetected(indicators) {
    UI.logEvent('🚨 RANSOMWARE THREAT DETECTED BY AI FUSION PIPELINE', 'danger');

    if (window.EventBus) {
      EventBus.emit(EventBus.Events.RANSOMWARE_DETECTED, {
        score: finalScore,
        latency: LatencyTracker.getSummary(),
        indicators
      });
      EventBus.emit(EventBus.Events.STAGE_CHANGED, {
        stage: 'EARLY_DETECTION_TRIGGERED',
        title: 'Early Ransomware Detection Triggered',
        text: 'Multi-signal fusion reached critical threshold. The adaptive decoy access combined with anomalous traversal velocity confirmed malicious intent.'
      });
    }

    setTimeout(() => {
      UI.logEvent('🛡️ Incident Response: Simulated process containment initiated', 'danger');
      UI.showAlert({
        score: finalScore,
        anomaly: `${Math.round(indicators.behaviorDeviation)}%`,
        latency: LatencyTracker.getSummary().toDetection != null ? `${LatencyTracker.getSummary().toDetection}s` : '1.8s'
      });
      IncidentReport.generate();
    }, 450);
  }

  function decay() {
    RuleEngine.decay(1.2);
    recompute();
  }

  function getScore() { return finalScore; }
  function getRuleScore() { return RuleEngine.getScore(); }
  function getMLScore() { return mlScore; }
  function getMLClassification() { return mlClassification; }
  function getPathAnomalyScore() { return pathAnomalyScore; }
  function getIndicators() { return RuleEngine.getIndicators(); }
  function isDetected() { return detected; }

  function reset() {
    finalScore = 0;
    mlScore = 0;
    mlClassification = 'NORMAL';
    pathAnomalyScore = 0;
    detected = false;

    RuleEngine.reset();
    MLEngine.reset();
    FeatureExtractor.reset();
    LatencyTracker.reset();

    if (window.PathAnalysis) PathAnalysis.reset();

    UI.updateThreatScore(0, 'LOW', 'low');
    UI.updateLatency(LatencyTracker.getSummary());
    UI.updateThreatBreakdown({
      ruleScore: 0,
      mlScore: 0,
      mlClassification: 'NORMAL',
      decoyActive: false,
      pathAnomalyScore: 0,
      finalScore: 0
    });
    UI.updateExplainability(Explainability.build({
      indicators: RuleEngine.getIndicators(),
      metrics: BehaviorEngine.getMetrics(),
      baseline: BehaviorEngine.getBaseline(),
      mlScore: 0,
      mlClassification: 'NORMAL',
      decoyTriggered: false
    }));

    SceneManager.setAICoreLevel('low');
    SceneManager.updateSecurityShield('normal');
  }

  return {
    setIndicator,
    bumpIndicator,
    decay,
    getScore,
    getRuleScore,
    getMLScore,
    getMLClassification,
    getPathAnomalyScore,
    getIndicators,
    isDetected,
    band,
    bandLabel,
    reset
  };
})();

window.Detection = Detection;
