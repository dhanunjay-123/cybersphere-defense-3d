/* =========================================================
   experiment.js
   Experiment Mode (spec section 16): runs several synthetic
   simulations — one normal run and several ransomware
   variants, each repeated a few times for basic run-to-run
   variance — and records the actually-computed outcome of
   each. Nothing here is pre-written; every row comes from
   HeadlessSim.runScenario() executing the real detection math.
   ========================================================= */

const Experiment = (() => {

  const REPEATS_PER_SCENARIO = 3;
  let lastRuns = [];

  function runAll() {
    const scenarioKeys = Object.keys(HeadlessSim.SCENARIOS);
    const runs = [];
    let runId = 1;

    scenarioKeys.forEach(key => {
      for (let i = 0; i < REPEATS_PER_SCENARIO; i++) {
        const result = HeadlessSim.runScenario(key);
        runs.push({
          runId: `EXP-${String(runId++).padStart(3, '0')}`,
          behaviorType: result.label,
          mlScore: result.peakMLScore,
          threatScore: result.peakThreatScore,
          decoyTriggered: result.decoyTouched,
          detectionResult: result.isAttack
            ? (result.detected ? 'DETECTED' : 'MISSED')
            : (result.detected ? 'FALSE POSITIVE' : 'CORRECT REJECTION'),
          detectionTime: result.detectionSeconds != null ? `${result.detectionSeconds}s` : '—'
        });
      }
    });

    lastRuns = runs;
    return runs;
  }

  function getLastRuns() { return lastRuns; }

  return { runAll, getLastRuns };
})();

window.Experiment = Experiment;
