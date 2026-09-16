/* =========================================================
   mlEngine.js
   The ML layer of the detection pipeline — separate from the
   Rule Engine. Generates a synthetic "normal behavior" training
   set, fits a real Isolation Forest (isolationForest.js) on it,
   and scores incoming feature vectors from FeatureExtractor.

   If BackendClient reports a live Python/FastAPI connection
   (scikit-learn IsolationForest over a WebSocket — see
   backend/main.py), MLEngine prefers that score so the app
   matches the intended final architecture:
     Python -> scikit-learn -> IsolationForest -> FastAPI ->
     WebSocket -> Three.js
   Falling back seamlessly keeps the app fully runnable with
   zero setup when no backend is running.
   ========================================================= */

const MLEngine = (() => {

  let forest = null;
  let ready = false;
  let lastLocalScore = 0;
  let lastBackendScore = null;
  let lastSource = 'local';

  // Generates one synthetic "normal user" feature sample. Values
  // are centered on the same baseline BehaviorEngine uses, with
  // gaussian-ish noise — a decoy is, by definition, never touched
  // by a legitimate normal user, so decoy_interaction stays 0.
  function syntheticNormalSample() {
    const noise = () => (Math.random() + Math.random() + Math.random() - 1.5); // ~triangular, mean 0
    const sample = {
      files_accessed_per_minute: Math.max(0, 8 + noise() * 3),
      directory_changes: Math.max(0, 3 + noise() * 1.4),
      file_modifications: Math.max(0, 4 + noise() * 2),
      traversal_speed: Math.max(0, 6 + noise() * 3),
      unique_extensions: Math.max(0, 2 + Math.round(noise())),
      behavior_deviation: Math.max(0, 5 + noise() * 3),
      process_activity: Math.max(0, 4 + noise() * 3),
      decoy_interaction: 0
    };
    return Config.FEATURE_ORDER.map(k => Config.normalize(k, sample[k]));
  }

  function train() {
    const data = [];
    for (let i = 0; i < Config.ML_PARAMS.trainingSamples; i++) data.push(syntheticNormalSample());
    forest = new IsolationForest({
      numTrees: Config.ML_PARAMS.numTrees,
      sampleSize: Config.ML_PARAMS.sampleSize
    });
    forest.fit(data);
    ready = true;
    return data.length;
  }

  // Score a normalized feature vector -> 0..100 anomaly score.
  function scoreLocal(normalizedVector) {
    if (!ready) train();
    const raw = forest.score(normalizedVector); // ~0..1, >0.5 trending anomalous
    // Rescale so ~0.5 (typical for isolation forests on normal data)
    // sits near the bottom of the range and 0.62+ approaches 100 —
    // matches empirical behavior of this forest configuration.
    const rescaled = Math.max(0, Math.min(1, (raw - 0.38) / (0.62 - 0.38)));
    return Math.round(rescaled * 100);
  }

  // Called every detection tick with the current normalized vector.
  function evaluate(normalizedVector) {
    lastLocalScore = scoreLocal(normalizedVector);

    if (window.BackendClient && BackendClient.isConnected()) {
      BackendClient.requestScore(normalizedVector); // async — result arrives via onBackendScore
      if (lastBackendScore !== null) {
        lastSource = 'backend';
        return lastBackendScore;
      }
    }
    lastSource = 'local';
    return lastLocalScore;
  }

  // BackendClient calls this when a WebSocket response arrives.
  function onBackendScore(score01) {
    lastBackendScore = Math.round(Math.max(0, Math.min(1, score01)) * 100);
  }

  function classify(score) {
    return score >= Config.ML_PARAMS.anomalyThreshold * 100 ? 'ANOMALOUS' : 'NORMAL';
  }

  function getSource() { return lastSource; }
  function isReady() { return ready; }

  function reset() {
    lastLocalScore = 0;
    lastBackendScore = null;
    lastSource = window.BackendClient && BackendClient.isConnected() ? 'backend' : 'local';
  }

  return { train, evaluate, classify, onBackendScore, getSource, isReady, reset, scoreVector: scoreLocal };
})();

window.MLEngine = MLEngine;
