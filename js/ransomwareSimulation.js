/* =========================================================
   ransomwareSimulation.js
   CYBERSPHERE DEFENSE 3D — Safe Simulated Ransomware Engine
   Operates 100% against in-memory virtual objects.
   Simulates RANSOMWARE_SIM_001 traversing directories,
   triggering feature spikes, path anomalies, and the decoy tripwire.
   ========================================================= */

const RansomwareSimulation = (() => {

  let running = false;
  let paused = false;
  let stepTimer = null;
  let stepIndex = 0;
  let path = [];
  let touched = 0;
  let seenExtensions = new Set();
  let recordedFrames = []; // For Replay Mode (Section 43)

  function buildAttackPath() {
    const rootId = App.state.rootId;
    const documents = FileSystem.get(rootId)?.children
      .map(id => FileSystem.get(id)).find(n => n && n.name === 'Documents');
    if (!documents) return [rootId];

    const research = documents.children.map(id => FileSystem.get(id)).find(n => n && n.name === 'Research');
    const projects = documents.children.map(id => FileSystem.get(id)).find(n => n && n.name === 'Projects');
    const reports  = documents.children.map(id => FileSystem.get(id)).find(n => n && n.name === 'Reports');

    const seq = [rootId, documents.id];

    // Visit Projects first
    if (projects) {
      seq.push(projects.id);
      FileSystem.getFiles(projects.id).forEach(f => seq.push(f.id));
    }

    // Then sweep into Research (where Decoy usually resides)
    if (research) {
      seq.push(research.id);
      const researchFiles = FileSystem.getFiles(research.id);
      // Ensure normal files come first, and decoy file is placed strategically
      const normalFiles = researchFiles.filter(f => !f.isDecoy);
      const decoys = researchFiles.filter(f => f.isDecoy);
      normalFiles.slice(0, 2).forEach(f => seq.push(f.id));
      decoys.forEach(d => seq.push(d.id));
      normalFiles.slice(2).forEach(f => seq.push(f.id));
    }

    // Then sweep into Reports
    if (reports) {
      seq.push(reports.id);
      FileSystem.getFiles(reports.id).forEach(f => seq.push(f.id));
    }

    return seq;
  }

  function start() {
    if (running) return;
    running = true;
    paused = false;
    stepIndex = 0;
    touched = 0;
    seenExtensions = new Set();

    // Ensure panoramic tactical overview so full attack trajectory is visible across the entire 3D graph
    if (window.SceneManager && SceneManager.resetCamera) {
      SceneManager.resetCamera();
    }

    // Ensure adaptive decoy is present in attack path
    if (window.DecoyEngine && DecoyEngine.getDeployed().length === 0) {
      DecoyEngine.deployToRecommended() || DecoyEngine.deployToResearchDefault();
    }

    path = buildAttackPath();

    UI.setSimBanner('attack', '⚠ SIMULATION ACTIVE — Process: RANSOMWARE_SIM_001 (Virtual Only)');
    UI.logEvent('⚠️ Suspicious process spawned: RANSOMWARE_SIM_001', 'danger');
    UI.setAIStatus('ALERT: Analyzing suspicious process behavior & file path…');
    UI.enableIncidentButton(false);
    if (window.UI && UI.updateProcessDetails) {
      UI.updateProcessDetails({ type: 'ransomware', isIsolated: false });
    }

    // Spawn 3D Threat Drone at Root Computer
    SceneManager.spawnProcess(App.state.rootId, 'ransomware');
    SceneManager.updateSecurityShield('suspicious');

    // Gradual initial suspicion
    Detection.bumpIndicator('processSuspicion', 35);
    LatencyTracker.markStart();

    if (window.EventBus) {
      EventBus.emit(EventBus.Events.STAGE_CHANGED, {
        stage: 'RANSOMWARE_SWEEP',
        title: 'Simulated Ransomware Sweep',
        text: 'Process RANSOMWARE_SIM_001 is executing an automated directory traversal, rapidly accessing files across folder branches.'
      });
    }

    // Trigger instant mobile incident notification upon attack initiation
    if (window.MobileAlertEngine && MobileAlertEngine.triggerAlert) {
      MobileAlertEngine.triggerAlert({
        title: '⚠️ ALERT: Ransomware Sweep Initiated!',
        targetPath: '/Documents/Projects',
        process: 'RANSOMWARE_SIM_001 (PID 9104)',
        threatScore: '65% (Elevated Traversal)',
        latency: '0.35s',
        actionTaken: 'Real-Time Behavioral Tracking & Decoy Defense Armed'
      });
    }

    scheduleNext(420);
  }

  function scheduleNext(delay) {
    clearTimeout(stepTimer);
    if (!running || paused) return;
    stepTimer = setTimeout(tick, delay);
  }

  function tick() {
    if (!running || paused) return;
    if (stepIndex >= path.length) {
      finish();
      return;
    }

    const fromId = path[Math.max(0, stepIndex - 1)];
    const toId = path[stepIndex];
    const toNode = FileSystem.get(toId);
    if (!toNode) {
      stepIndex++;
      scheduleNext(60);
      return;
    }

    const isDecoy = Boolean(toNode.isDecoy);

    // Move 3D Threat Drone and emit red telemetry particles
    SceneManager.moveProcessTo(toId, 0.35);
    SceneManager.spawnParticle(fromId, toId, 'threat', 0.35);
    FileSystem.touch(toId);
    touched++;

    // Track path analysis
    PathAnalysis.recordStep(toId, 'RANSOMWARE_SIM_001');

    // Section 20: Gradual threat score progression
    const progress = Math.min(1.0, stepIndex / Math.max(1, path.length - 1));

    if (toNode.type === 'folder' || toNode.type === 'root') {
      Detection.bumpIndicator('traversalSpeed', 7 + Math.round(progress * 8));
      UI.logEvent(`Rapid directory traversal detected: ${FileSystem.getPath(toId)}`, 'warn');
      if (window.SceneManager && SceneManager.updateSectorAlert) {
        SceneManager.updateSectorAlert(toId, true);
      }
      if (window.EventBus) {
        EventBus.emit(EventBus.Events.DIRECTORY_ENTERED, { nodeId: toId, name: toNode.name });
      }
    } else if (isDecoy) {
      // CLIMAX: Decoy accessed!
      Detection.setIndicator('decoyInteraction', 100);
      Detection.bumpIndicator('behaviorDeviation', 45);
      Detection.bumpIndicator('accessFrequency', 30);

      UI.logEvent(`🚨 CRITICAL: Adaptive decoy accessed — ${toNode.name}`, 'danger');
      if (window.UI && UI.showToast) {
        UI.showToast('🚨 DECOY TRIPWIRE TRIGGERED', `RANSOMWARE_SIM_001 touched decoy ${toNode.name} in /Research`, 'danger', 4500);
      }
      if (SceneManager.triggerDecoyEmp) {
        SceneManager.triggerDecoyEmp(toId);
      } else {
        SceneManager.detectionShockwave(toId);
      }
      // Keep wide panoramic framing so entire EMP ripple and laser containment cage are visible
      SceneManager.focusOn(toId, 38);
      SceneManager.updateSecurityShield('decoy');

      // Trigger Out-of-Band Mobile Incident Push Escalation
      if (window.MobileAlertEngine && MobileAlertEngine.triggerAlert) {
        const fullPath = FileSystem.getPath(toId);
        const threatScore = (window.ThreatFusion && ThreatFusion.getFusedScore) ? `${ThreatFusion.getFusedScore()}% (Critical)` : '72% (Critical)';
        const latency = (window.LatencyTracker && LatencyTracker.getDetectionLatencyMs) ? `${(LatencyTracker.getDetectionLatencyMs() / 1000).toFixed(2)}s` : '2.14s';
        MobileAlertEngine.triggerAlert({
          title: '🚨 CRITICAL: Ransomware Tripwire Breached!',
          targetPath: fullPath,
          process: 'RANSOMWARE_SIM_001 (PID 9104)',
          threatScore: threatScore,
          latency: latency,
          actionTaken: 'Process Isolated in Sandbox & Host Network Quarantined'
        });
      }

      if (window.EventBus) {
        EventBus.emit(EventBus.Events.DECOY_ACCESSED, {
          nodeId: toId,
          name: toNode.name,
          process: 'RANSOMWARE_SIM_001',
          path: FileSystem.getPath(toId)
        });
      }

      setTimeout(() => {
        finish();
      }, 1200);
      return;
    } else {
      // Regular file access / simulated encryption attempt
      if (SceneManager.corruptNode) {
        SceneManager.corruptNode(toId);
      }
      Detection.bumpIndicator('accessFrequency', 5 + Math.round(progress * 5));
      Detection.bumpIndicator('modificationFrequency', 6 + Math.round(progress * 6));
      Detection.bumpIndicator('filesTouched', 4);

      if (toNode.ext) seenExtensions.add(toNode.ext);
      if (['exe', 'zip', 'docx', 'xlsx', 'pdf'].includes(toNode.ext) && seenExtensions.size > 3) {
        Detection.bumpIndicator('unusualExtensions', 12);
      }
      UI.logEvent(`Mass file access event: ${toNode.name}`, 'warn');

      if (window.EventBus) {
        EventBus.emit(EventBus.Events.FILE_ACCESSED, {
          nodeId: toId,
          fileName: toNode.name,
          path: FileSystem.getPath(toId),
          isDecoy: false
        });
      }
    }

    Detection.bumpIndicator('behaviorDeviation', 3 + Math.round(progress * 6));

    // Update Path Analysis HUD
    UI.updatePathAnalysis({
      source: 'RANSOMWARE_SIM_001 (Unverified Process)',
      current: FileSystem.getPath(toId),
      trace: PathAnalysis.getCurrentTrace()
    });

    // Update behavior metrics: realistic rapid escalation
    const modRate = progress > 0.5 ? 'VERY HIGH' : progress > 0.25 ? 'HIGH' : 'MEDIUM';
    const liveMetrics = {
      filesPerMin: Math.round(8 + progress * 135),
      dirChangesPerMin: Math.round(3 + progress * 28),
      modRate,
      similarity: Math.max(4, Math.round(96 - progress * 88)),
      anomaly: Math.min(99, Math.round(4 + progress * 94))
    };
    UI.updateBehaviorMetrics(liveMetrics, BehaviorEngine.getBaseline());
    window.__lastBehaviorMetrics = liveMetrics;

    FeatureExtractor.update({
      files_accessed_per_minute: liveMetrics.filesPerMin,
      directory_changes: liveMetrics.dirChangesPerMin,
      file_modifications: modRate === 'VERY HIGH' ? 92 : modRate === 'HIGH' ? 68 : 35,
      traversal_speed: Detection.getIndicators().traversalSpeed,
      unique_extensions: seenExtensions.size,
      behavior_deviation: liveMetrics.anomaly,
      process_activity: Math.round(45 + progress * 50),
      decoy_interaction: isDecoy ? 100 : Detection.getIndicators().decoyInteraction
    });

    // Trigger detection evaluation tick
    Detection.bumpIndicator('processSuspicion', 1);

    Analytics.recordTick({
      filesAccessed: liveMetrics.filesPerMin,
      threatScore: Detection.getScore(),
      traversal: liveMetrics.dirChangesPerMin,
      modificationRate: modRate === 'VERY HIGH' ? 92 : modRate === 'HIGH' ? 68 : 25,
      mlAnomaly: Detection.getMLScore(),
      decoyInteractions: Detection.getIndicators().decoyInteraction >= 80 ? 1 : 0,
      normalEvents: 0,
      suspiciousEvents: 1
    });

    // Record frame for Replay Mode
    recordFrame({
      stepIndex,
      nodeId: toId,
      path: FileSystem.getPath(toId),
      threatScore: Detection.getScore(),
      mlScore: Detection.getMLScore(),
      ruleScore: Detection.getRuleScore(),
      metrics: { ...liveMetrics },
      isDecoy
    });

    stepIndex++;
    if (stepIndex >= path.length) {
      finish();
      return;
    }

    // Cinematic step delay (460ms) so the 3D attack drone is clearly visible traversing across nodes
    scheduleNext(460);
  }

  function recordFrame(frame) {
    recordedFrames.push(frame);
  }

  function getRecordedFrames() {
    return [...recordedFrames];
  }

  function finish() {
    if (!Detection.isDetected()) {
      Detection.setIndicator('decoyInteraction', Math.max(Detection.getIndicators().decoyInteraction, 95));
    }
    running = false;
    clearTimeout(stepTimer);

    SceneManager.isolateProcess();
    if (window.UI && UI.updateProcessDetails) {
      UI.updateProcessDetails({ type: 'ransomware', isIsolated: true });
    }
    UI.setSimBanner('detected', '🛡️ THREAT CONTAINED — Simulated process isolated in virtual environment');
    UI.enableIncidentButton(true);
    UI.enableAttackButton(true);

    if (window.EventBus) {
      EventBus.emit(EventBus.Events.INCIDENT_CONTAINED, {
        process: 'RANSOMWARE_SIM_001',
        threatScore: Detection.getScore(),
        status: 'ISOLATED'
      });
    }
  }

  function pause() {
    paused = !paused;
    if (!paused) scheduleNext(180);
    return paused;
  }

  function stop() {
    running = false;
    paused = false;
    clearTimeout(stepTimer);
    SceneManager.removeProcess();
    UI.setSimBanner('normal', 'Simulation stopped');
    UI.enableAttackButton(true);
  }

  function isRunning() { return running; }
  function isPaused() { return paused; }

  function reset() {
    stop();
    stepIndex = 0;
    touched = 0;
    path = [];
    recordedFrames = [];
  }

  return {
    start,
    pause,
    stop,
    isRunning,
    isPaused,
    getRecordedFrames,
    reset
  };
})();

window.RansomwareSimulation = RansomwareSimulation;
