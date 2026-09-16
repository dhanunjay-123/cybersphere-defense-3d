/* =========================================================
   config.js
   Single source of truth for tunable numbers used across the
   detection pipeline: feature normalization ranges, threat
   fusion weights, and threat-level bands. Keeping every
   "magic number" here (per the project's own code-quality
   requirement) makes the scoring system transparent and easy
   to re-tune without touching engine logic.
   ========================================================= */

const Config = (() => {

  // Order matters: this IS the feature vector schema used by
  // FeatureExtractor, IsolationForest, and the Python backend.
  const FEATURE_ORDER = [
    'files_accessed_per_minute',
    'directory_changes',
    'file_modifications',
    'traversal_speed',
    'unique_extensions',
    'behavior_deviation',
    'process_activity',
    'decoy_interaction'
  ];

  // Min/max used to normalize each raw feature into [0, 1]
  // before it reaches the Isolation Forest. Ranges are based
  // on the plausible span of the simulation (normal baseline
  // up to full-speed simulated ransomware traversal).
  const FEATURE_RANGES = {
    files_accessed_per_minute: { min: 0, max: 160 },
    directory_changes:         { min: 0, max: 40  },
    file_modifications:        { min: 0, max: 100 },
    traversal_speed:           { min: 0, max: 100 },
    unique_extensions:         { min: 0, max: 8   },
    behavior_deviation:        { min: 0, max: 100 },
    process_activity:          { min: 0, max: 100 },
    decoy_interaction:         { min: 0, max: 100 }
  };

  // Threat Fusion: how much each independently-computed signal
  // contributes to the FINAL THREAT score. Kept in one place so
  // the scoring system is auditable during a viva.
  const FUSION_WEIGHTS = {
    ruleEngine:   0.28,
    mlAnomaly:    0.32,
    decoySignal:  0.25,
    pathAnomaly:  0.15
  };

  // Threat level bands (section 7 of the spec)
  const BANDS = [
    { key: 'low',      label: 'LOW',      min: 0,  max: 30  },
    { key: 'medium',   label: 'MEDIUM',   min: 31, max: 60  },
    { key: 'high',     label: 'HIGH',     min: 61, max: 80  },
    { key: 'critical', label: 'CRITICAL', min: 81, max: 100 }
  ];

  const DETECTION_THRESHOLD = 81;

  // Isolation Forest hyperparameters
  const ML_PARAMS = {
    numTrees: 80,
    sampleSize: 64,
    trainingSamples: 220,   // synthetic NORMAL samples used to fit the forest
    anomalyThreshold: 0.5   // 0-1 forest score above which behavior is ANOMALOUS
  };

  function normalize(name, value) {
    const r = FEATURE_RANGES[name];
    if (!r) return 0;
    const v = Math.max(r.min, Math.min(r.max, value));
    return (v - r.min) / (r.max - r.min || 1);
  }

  function bandFor(score) {
    return BANDS.find(b => score >= b.min && score <= b.max) || BANDS[0];
  }

  return {
    FEATURE_ORDER, FEATURE_RANGES, FUSION_WEIGHTS, BANDS,
    DETECTION_THRESHOLD, ML_PARAMS, normalize, bandFor
  };
})();

window.Config = Config;
