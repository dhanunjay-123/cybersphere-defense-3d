/* =========================================================
   behavior.js
   Simulates normal user file-access behavior: realistic,
   predictable movement through work directories (Research,
   Projects, Reports). Generates normal telemetry baseline.
   ========================================================= */

const BehaviorEngine = (() => {

  let running = false;
  let timer = null;
  let currentUserNodeId = null;

  // Baseline metrics (per minute)
  const baseline = {
    filesPerMin: 8,
    dirChangesPerMin: 3,
    modRate: 'Low'
  };

  let metrics = {
    filesPerMin: 8,
    dirChangesPerMin: 3,
    modRate: 'Low',
    similarity: 96,
    anomaly: 4
  };

  function pickWeightedFolder() {
    // Research folder receives more legitimate user visits -> naturally becomes high-value
    const rootId = App.state.rootId;
    const root = FileSystem.get(rootId);
    if (!root) return null;
    const documents = root.children.map(id => FileSystem.get(id)).find(n => n && n.name === 'Documents');
    if (!documents) return null;
    const subfolders = documents.children.map(id => FileSystem.get(id)).filter(Boolean);
    if (!subfolders.length) return null;

    const weights = subfolders.map(f => f.name === 'Research' ? 3.5 : f.name === 'Projects' ? 2 : 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < subfolders.length; i++) {
      if (r < weights[i]) return subfolders[i];
      r -= weights[i];
    }
    return subfolders[0];
  }

  function step() {
    if (!running) return;

    const rootId = App.state.rootId;
    const root = FileSystem.get(rootId);
    if (!root) return;
    const documents = root.children.map(id => FileSystem.get(id)).find(n => n && n.name === 'Documents');
    if (!documents) return;

    const folder = pickWeightedFolder();
    if (!folder) return;
    const files = FileSystem.getFiles(folder.id).filter(f => f.type === 'file');

    // Ensure user process is spawned if not already active
    if (!currentUserNodeId) {
      SceneManager.spawnProcess(rootId, 'user');
      currentUserNodeId = rootId;
      PathAnalysis.recordStep(rootId, 'User process');
    }

    // Step 1: Move from current position to Documents
    SceneManager.moveProcessTo(documents.id, 0.2);
    SceneManager.spawnParticle(currentUserNodeId, documents.id, 'normal', 0.2);
    currentUserNodeId = documents.id;
    FileSystem.touch(documents.id);
    PathAnalysis.recordStep(documents.id, 'User process');

    if (window.EventBus) {
      EventBus.emit(EventBus.Events.DIRECTORY_ENTERED, { nodeId: documents.id, name: 'Documents' });
    }

    setTimeout(() => {
      if (!running) return;

      // Step 2: Move from Documents into target folder
      SceneManager.moveProcessTo(folder.id, 0.22);
      SceneManager.spawnParticle(documents.id, folder.id, 'normal', 0.22);
      currentUserNodeId = folder.id;
      FileSystem.touch(folder.id);
      App.trackFolderActivity(folder.id);
      PathAnalysis.recordStep(folder.id, 'User process');

      if (window.EventBus) {
        EventBus.emit(EventBus.Events.DIRECTORY_ENTERED, { nodeId: folder.id, name: folder.name });
      }

      setTimeout(() => {
        if (!running) return;

        // Step 3: Access a file inside the folder
        if (files.length) {
          const file = files[Math.floor(Math.random() * files.length)];
          SceneManager.moveProcessTo(file.id, 0.2);
          SceneManager.spawnParticle(folder.id, file.id, 'normal', 0.2);
          currentUserNodeId = file.id;
          FileSystem.touch(file.id);
          PathAnalysis.recordStep(file.id, 'User process');

          UI.logEvent(`Normal user file access — ${file.name}`, 'info');

          if (window.EventBus) {
            EventBus.emit(EventBus.Events.FILE_ACCESSED, {
              nodeId: file.id,
              fileName: file.name,
              path: FileSystem.getPath(file.id),
              isDecoy: false
            });
          }

          UI.updatePathAnalysis({
            source: 'User process (authorized)',
            current: FileSystem.getPath(file.id),
            trace: PathAnalysis.getCurrentTrace()
          });
        }
      }, 250);
    }, 220);

    // Update behavioral metrics around normal baseline with gentle realistic noise
    metrics.filesPerMin = Math.round(baseline.filesPerMin + (Math.random() * 3 - 1.5));
    metrics.dirChangesPerMin = Math.round(baseline.dirChangesPerMin + (Math.random() * 1.6 - 0.8));
    metrics.similarity = 93 + Math.round(Math.random() * 5);
    metrics.anomaly = Math.max(1, 5 - Math.round(Math.random() * 3));
    UI.updateBehaviorMetrics(metrics, baseline);
    window.__lastBehaviorMetrics = metrics;

    FeatureExtractor.update({
      files_accessed_per_minute: metrics.filesPerMin,
      directory_changes: metrics.dirChangesPerMin,
      file_modifications: 4 + Math.random() * 2,
      traversal_speed: metrics.dirChangesPerMin * 1.5,
      unique_extensions: 2,
      behavior_deviation: metrics.anomaly,
      process_activity: 12,
      decoy_interaction: 0
    });

    Detection.bumpIndicator('accessFrequency', 0); // triggers recompute

    Analytics.recordTick({
      filesAccessed: metrics.filesPerMin,
      threatScore: Detection.getScore(),
      traversal: metrics.dirChangesPerMin,
      modificationRate: 8,
      mlAnomaly: Detection.getMLScore(),
      decoyInteractions: 0,
      normalEvents: 1,
      suspiciousEvents: 0
    });

    const delay = 900 + Math.random() * 400;
    timer = setTimeout(step, delay);
  }

  function start() {
    if (running) return;
    running = true;
    currentUserNodeId = null;
    if (window.UI && UI.updateProcessDetails) {
      UI.updateProcessDetails({ type: 'user', isIsolated: false });
    }
    UI.setAIStatus('Active: Monitoring normal user baseline…');
    if (window.EventBus) {
      EventBus.emit(EventBus.Events.STAGE_CHANGED, {
        stage: 'NORMAL_USER_ACTIVITY',
        title: 'Normal User Activity',
        text: 'The user process is accessing legitimate files at an expected cadence. Features match normal baseline distribution.'
      });
    }
    step();
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    if (window.UI && UI.updateProcessDetails) {
      UI.updateProcessDetails({ type: 'none', isIsolated: false });
    }
    if (currentUserNodeId && window.SceneManager) {
      SceneManager.removeProcess();
      currentUserNodeId = null;
    }
  }

  function isRunning() { return running; }
  function getMetrics() { return metrics; }
  function getBaseline() { return baseline; }

  function reset() {
    stop();
    currentUserNodeId = null;
    metrics = { filesPerMin: 8, dirChangesPerMin: 3, modRate: 'Low', similarity: 96, anomaly: 4 };
  }

  return { start, stop, isRunning, getMetrics, getBaseline, reset };
})();

window.BehaviorEngine = BehaviorEngine;
