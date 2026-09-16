/* =========================================================
   demoGuide.js
   CYBERSPHERE DEFENSE 3D — Guided Demo, Step-by-Step & Replay
   Implements:
     1. Guided Demo Mode (12-step narrated automated research walkthrough)
     2. Step-by-Step Viva Mode (manual Next/Previous progression)
     3. Simulation Replay Mode (playback at 0.5x, 1x, 2x, 5x)
   ========================================================= */

const DemoGuide = (() => {

  let isGuidedActive = false;
  let currentStepIndex = 0;
  let demoTimer = null;
  let replaySpeed = 1.0;
  let isReplaying = false;

  const STEPS = [
    {
      id: 1,
      title: 'Step 1: Establish Normal Baseline',
      explanation: 'The system initializes the virtual filesystem topology and establishes the synthetic baseline profile representing typical user interaction rates.',
      action: () => {
        App.resetEnvironment();
        SceneManager.resetCamera();
        UI.setAIStatus('Step 1: Baseline established (Files: 8/min, Dirs: 3/min)');
      }
    },
    {
      id: 2,
      title: 'Step 2: Monitor User Behavior',
      explanation: 'Authorized user process accesses files within Documents and Research at a steady, predictable pace with low modification activity.',
      action: () => {
        BehaviorEngine.start();
        SceneManager.focusOn('root-1', 26);
      }
    },
    {
      id: 3,
      title: 'Step 3: Extract Behavioral Features',
      explanation: 'Telemetry is mapped into an 8-dimensional normalized feature vector: access rate, directory hops, modifications, traversal speed, and deviation.',
      action: () => {
        SceneManager.focusOnAICore();
        UI.setAIStatus('Step 3: 8-dimensional feature vector extracted');
      }
    },
    {
      id: 4,
      title: 'Step 4: Analyze File Paths',
      explanation: 'PathAnalysis inspects directory depth and branch hop velocity. Normal user access remains localized to work folders with zero cross-branch jumping.',
      action: () => {
        UI.scrollToPanel('path-panel');
      }
    },
    {
      id: 5,
      title: 'Step 5: Run Rule Engine + Isolation Forest',
      explanation: 'The rule engine evaluates behavioral indicators while the Isolation Forest scores the normalized vector. Both confirm NORMAL user activity.',
      action: () => {
        UI.scrollToPanel('threat-breakdown-panel');
      }
    },
    {
      id: 6,
      title: 'Step 6: Rank Risky Directory',
      explanation: 'Adaptive Decoy Engine analyzes per-directory risk using access frequency, file criticality, and modification rates. /Documents/Research emerges as top candidate.',
      action: () => {
        DecoyEngine.watch();
        const ranking = DecoyEngine.computeRiskRanking();
        UI.updateDecoyRiskRanking(ranking);
        UI.scrollToPanel('decoy-risk-panel');
      }
    },
    {
      id: 7,
      title: 'Step 7: Deploy Adaptive Decoy',
      explanation: 'An adaptive decoy file (research_backup.docx) is materialized inside the high-risk directory. It acts as a passive, high-confidence tripwire.',
      action: () => {
        BehaviorEngine.stop();
        const decoy = DecoyEngine.deployToResearchDefault();
        if (decoy) {
          SceneManager.focusOn(decoy.id, 36);
        }
      }
    },
    {
      id: 8,
      title: 'Step 8: Start Simulated Ransomware',
      explanation: 'Process RANSOMWARE_SIM_001 initiates rapid directory traversal. Features begin escalating, drawing red traversal trails in the 3D filesystem.',
      action: () => {
        RansomwareSimulation.start();
        SceneManager.focusOnProcess();
      }
    },
    {
      id: 9,
      title: 'Step 9: Ransomware Reaches Decoy',
      explanation: 'During its automated sweep, the ransomware opens the adaptive decoy file. The tripwire is triggered, pulsing the 3D scene and raising a critical alarm.',
      action: () => {
        // RansomwareSimulation reaches the decoy automatically
        SceneManager.focusOnDecoy();
      }
    },
    {
      id: 10,
      title: 'Step 10: Early Detection Triggered',
      explanation: 'Threat Fusion combines the 100% decoy signal with high ML anomaly and rule scores. Total threat exceeds threshold within ~2.1 seconds.',
      action: () => {
        SceneManager.resetCamera();
      }
    },
    {
      id: 11,
      title: 'Step 11: Incident Response & Containment',
      explanation: 'The simulated ransomware process is isolated in the virtual environment. Red traversal paths are severed and a blue containment shield locks down.',
      action: () => {
        SceneManager.isolateProcess();
        SceneManager.updateSecurityShield('contained');
      }
    },
    {
      id: 12,
      title: 'Step 12: Review Incident Report',
      explanation: 'A comprehensive incident summary is generated with exact measured detection latency, affected virtual paths, ML anomaly score, and containment status.',
      action: () => {
        const report = IncidentReport.getLast() || IncidentReport.generate();
        UI.renderIncident(report);
        UI.openIncidentModal();
      }
    }
  ];

  /* ---------------- Guided Automated Tour ---------------- */

  function startGuidedDemo() {
    isGuidedActive = true;
    currentStepIndex = 0;
    clearTimeout(demoTimer);
    UI.logEvent('🎬 Guided Demo Mode started (12 research steps)', 'info');
    runNextGuidedStep();
  }

  function runNextGuidedStep() {
    if (!isGuidedActive || currentStepIndex >= STEPS.length) {
      isGuidedActive = false;
      UI.logEvent('✅ Guided Demo completed successfully', 'success');
      return;
    }

    const step = STEPS[currentStepIndex];
    applyStep(currentStepIndex);

    // Dynamic delay per step to allow viewing animations
    let delay = 3500;
    if (step.id === 2) delay = 4500;      // let normal behavior run a few seconds
    if (step.id === 7) delay = 3000;      // decoy deployment
    if (step.id === 8) delay = 5500;      // let attack progress to decoy & detect
    if (step.id === 12) delay = 6000;

    currentStepIndex++;
    demoTimer = setTimeout(runNextGuidedStep, delay);
  }

  function stopGuidedDemo() {
    isGuidedActive = false;
    clearTimeout(demoTimer);
  }

  /* ---------------- Step-by-Step Viva Mode ---------------- */

  function applyStep(index) {
    if (index < 0 || index >= STEPS.length) return;
    currentStepIndex = index;
    const step = STEPS[index];

    // Update Educational Explanation Panel
    UI.updateEducationalPanel({
      stepNumber: step.id,
      totalSteps: STEPS.length,
      title: step.title,
      text: step.explanation
    });

    UI.logEvent(`[${step.title}]`, 'info');

    try {
      step.action();
    } catch (err) {
      console.warn('[DemoGuide] Step action error:', err);
    }
  }

  function nextStep() {
    stopGuidedDemo();
    if (currentStepIndex < STEPS.length - 1) {
      applyStep(currentStepIndex + 1);
    }
  }

  function prevStep() {
    stopGuidedDemo();
    if (currentStepIndex > 0) {
      applyStep(currentStepIndex - 1);
    }
  }

  /* ---------------- Replay Mode ---------------- */

  function startReplay(speed = 1.0) {
    replaySpeed = speed;
    const frames = RansomwareSimulation.getRecordedFrames();
    if (!frames.length) {
      UI.logEvent('No recorded attack to replay. Run a simulation first.', 'warn');
      return;
    }

    isReplaying = true;
    UI.logEvent(`▶ Replaying attack sequence (${replaySpeed}× speed, ${frames.length} frames)`, 'info');

    // Reset environment without wiping recorded frames
    SceneManager.reset();
    SceneManager.spawnProcess(App.state.rootId, 'ransomware');

    let fIdx = 0;
    function playFrame() {
      if (!isReplaying || fIdx >= frames.length) {
        isReplaying = false;
        UI.logEvent('Replay playback finished', 'success');
        return;
      }
      const f = frames[fIdx];
      SceneManager.moveProcessTo(f.nodeId, 0.35 / replaySpeed);
      UI.updateThreatScore(f.threatScore, Config.bandFor(f.threatScore).label, Config.bandFor(f.threatScore).key);
      UI.updateBehaviorMetrics(f.metrics, BehaviorEngine.getBaseline());

      if (f.isDecoy) {
        SceneManager.detectionShockwave(f.nodeId);
      }

      fIdx++;
      setTimeout(playFrame, 350 / replaySpeed);
    }

    playFrame();
  }

  function stopReplay() {
    isReplaying = false;
  }

  return {
    startGuidedDemo,
    stopGuidedDemo,
    nextStep,
    prevStep,
    applyStep,
    startReplay,
    stopReplay,
    getCurrentStep: () => currentStepIndex,
    isGuidedActive: () => isGuidedActive
  };
})();

window.DemoGuide = DemoGuide;
