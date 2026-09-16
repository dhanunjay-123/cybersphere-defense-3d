/* =========================================================
   features.js
   Turns the current simulation state into the consistent
   8-dimensional behavioral feature vector used by both the
   Rule Engine and the ML Engine. This module knows nothing
   about Three.js or the DOM — it only reads plain numbers
   from BehaviorEngine / RansomwareSimulation / RuleEngine and
   produces raw + normalized vectors.
   ========================================================= */

const FeatureExtractor = (() => {

  // Raw (un-normalized) feature values, updated every tick by
  // whichever engine is currently driving activity.
  let raw = {
    files_accessed_per_minute: 8,
    directory_changes: 3,
    file_modifications: 4,
    traversal_speed: 5,
    unique_extensions: 2,
    behavior_deviation: 4,
    process_activity: 0,
    decoy_interaction: 0
  };

  function update(partial) {
    raw = { ...raw, ...partial };
  }

  function getRaw() {
    return { ...raw };
  }

  // Ordered raw array (matches Config.FEATURE_ORDER)
  function getRawVector() {
    return Config.FEATURE_ORDER.map(k => raw[k]);
  }

  // Ordered, min-max normalized array in [0,1] — what actually
  // gets fed into the Isolation Forest / backend.
  function getNormalizedVector() {
    return Config.FEATURE_ORDER.map(k => Config.normalize(k, raw[k]));
  }

  function reset() {
    raw = {
      files_accessed_per_minute: 8,
      directory_changes: 3,
      file_modifications: 4,
      traversal_speed: 5,
      unique_extensions: 2,
      behavior_deviation: 4,
      process_activity: 0,
      decoy_interaction: 0
    };
  }

  return { update, getRaw, getRawVector, getNormalizedVector, reset };
})();

window.FeatureExtractor = FeatureExtractor;
