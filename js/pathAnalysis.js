/* =========================================================
   pathAnalysis.js
   Analyzes file-system path traversal patterns in real time.
   Distinguishes focused user workflows from rapid tree-sweeping
   ransomware traversal by evaluating directory hop rate,
   traversal depth, cross-branch jumping, and path entropy.
   ========================================================= */

const PathAnalysis = (() => {
  let activePath = [];          // list of node objects in current chain
  let traversalHistory = [];    // rolling window of recently visited node IDs
  const WINDOW_SIZE = 20;

  let currentSource = 'Idle';
  let pathAnomalyScore = 0;
  let metrics = {
    currentDepth: 0,
    uniqueDirsTouched: 1,
    crossBranchJumps: 0,
    hopVelocity: 'LOW',
    anomalyScore: 0
  };

  function recordStep(nodeId, source = 'User process') {
    if (!nodeId || !window.FileSystem) return;
    const node = FileSystem.get(nodeId);
    if (!node) return;

    currentSource = source;

    // Build chain from root to this node
    const chain = [];
    let cur = node;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId ? FileSystem.get(cur.parentId) : null;
    }
    activePath = chain;

    // Rolling history for velocity & breadth analysis
    traversalHistory.push({
      id: nodeId,
      type: node.type,
      parentId: node.parentId,
      time: performance.now()
    });
    if (traversalHistory.length > WINDOW_SIZE) traversalHistory.shift();

    recalculate();

    if (window.EventBus) {
      EventBus.emit(EventBus.Events.PROCESS_MOVED, {
        nodeId,
        nodeName: node.name,
        path: FileSystem.getPath(nodeId),
        source,
        anomalyScore: pathAnomalyScore
      });
    }
  }

  function recalculate() {
    if (traversalHistory.length < 2) {
      pathAnomalyScore = 0;
      metrics.anomalyScore = 0;
      return;
    }

    const now = performance.now();
    const recent = traversalHistory.filter(h => now - h.time < 5000); // last 5 seconds

    // 1. Unique directories touched in rolling window
    const dirIds = new Set(
      recent.map(h => (h.type === 'folder' || h.type === 'root') ? h.id : h.parentId).filter(Boolean)
    );
    metrics.uniqueDirsTouched = dirIds.size;

    // 2. Cross-branch transitions (jumping between different top-level branches)
    let crossJumps = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].parentId && recent[i - 1].parentId && recent[i].parentId !== recent[i - 1].parentId) {
        crossJumps++;
      }
    }
    metrics.crossBranchJumps = crossJumps;

    // 3. Traversal depth
    metrics.currentDepth = activePath.length;

    // 4. Hop velocity (events per second in recent window)
    const spanSec = Math.max(0.5, (recent[recent.length - 1].time - recent[0].time) / 1000);
    const hopsPerSec = recent.length / spanSec;
    metrics.hopVelocity = hopsPerSec > 3.5 ? 'VERY HIGH' : hopsPerSec > 1.8 ? 'HIGH' : hopsPerSec > 0.8 ? 'MEDIUM' : 'LOW';

    // Composite Path Anomaly Score:
    // User activity: stays mostly within 1-2 directories, low hop rate -> anomaly 0-15%
    // Ransomware traversal: sweeps 4+ directories rapidly with many cross-branch jumps -> anomaly 70-95%
    const dirFactor = Math.min(45, (metrics.uniqueDirsTouched - 1) * 12);
    const velocityFactor = Math.min(35, hopsPerSec * 8);
    const jumpFactor = Math.min(20, crossJumps * 4);

    pathAnomalyScore = Math.round(Math.max(0, Math.min(100, dirFactor + velocityFactor + jumpFactor)));
    metrics.anomalyScore = pathAnomalyScore;
  }

  function getCurrentTrace() {
    if (!activePath.length) return [];
    const bandKey = window.Detection ? Detection.band(Detection.getScore()) : 'low';
    const isSuspicious = (currentSource.includes('Ransomware') || currentSource.includes('Unknown')) &&
                         (bandKey === 'high' || bandKey === 'critical');
    const isAnomaly = currentSource.includes('Ransomware') || currentSource.includes('Unknown') || bandKey === 'medium';

    return activePath.map((n, idx) => {
      let cls = 'normal';
      if (n.isDecoy) {
        cls = 'decoy';
      } else if (idx === activePath.length - 1) {
        cls = isSuspicious ? 'ransomware' : isAnomaly ? 'suspicious' : 'normal';
      } else if (isSuspicious) {
        cls = 'suspicious';
      }
      return {
        id: n.id,
        name: n.name,
        type: n.type,
        isDecoy: n.isDecoy,
        cls
      };
    });
  }

  function getBreadcrumbString() {
    if (!activePath.length) return 'Computer';
    return activePath.map(n => n.name).join(' > ');
  }

  function getCurrentPath() {
    if (!activePath.length) return '/';
    return '/' + activePath.filter(n => n.type !== 'root').map(n => n.name).join('/');
  }

  function getPathAnomalyScore() {
    return pathAnomalyScore;
  }

  function getMetrics() {
    return { ...metrics };
  }

  function getSource() {
    return currentSource;
  }

  function reset() {
    activePath = [];
    traversalHistory = [];
    currentSource = 'Idle';
    pathAnomalyScore = 0;
    metrics = {
      currentDepth: 0,
      uniqueDirsTouched: 1,
      crossBranchJumps: 0,
      hopVelocity: 'LOW',
      anomalyScore: 0
    };
  }

  return {
    recordStep,
    getCurrentTrace,
    getBreadcrumbString,
    getCurrentPath,
    getPathAnomalyScore,
    getMetrics,
    getSource,
    reset
  };
})();

window.PathAnalysis = PathAnalysis;
