/* =========================================================
   analytics.js
   CYBERSPHERE DEFENSE 3D — Analytics & Threat Radar Engine
   Provides:
     1. Large Primary Metric Chart with dynamic axis selector
     2. Live 6-axis Threat Radar Chart (Chart.js radar)
     3. Comprehensive Post-Attack Incident Report Generator
   ========================================================= */

const Analytics = (() => {

  const MAX_POINTS = 50;
  let mainCharts = [];
  let radarCharts = [];
  let currentMetric = 'threat'; // 'threat' | 'behavior' | 'traversal' | 'modification' | 'ml' | 'decoy'

  const timeSeries = {
    labels: [],
    threat: [],
    behavior: [],
    traversal: [],
    modification: [],
    ml: [],
    decoy: [],
    normalEvents: [],
    suspiciousEvents: []
  };

  const METRIC_CONFIGS = {
    threat: {
      label: 'Final Threat Score (%)',
      color: '#ff4757',
      bgColor: 'rgba(255, 71, 87, 0.15)',
      min: 0,
      max: 100,
      unit: '%'
    },
    behavior: {
      label: 'Behavior Deviation (%)',
      color: '#ff8a4d',
      bgColor: 'rgba(255, 138, 77, 0.15)',
      min: 0,
      max: 100,
      unit: '%'
    },
    traversal: {
      label: 'Directory Traversal (dirs/min)',
      color: '#e8a33d',
      bgColor: 'rgba(232, 163, 61, 0.15)',
      min: 0,
      max: 40,
      unit: ' dirs/min'
    },
    modification: {
      label: 'File Modification Rate (0-100)',
      color: '#ff5e7e',
      bgColor: 'rgba(255, 94, 126, 0.15)',
      min: 0,
      max: 100,
      unit: '%'
    },
    ml: {
      label: 'Isolation Forest Anomaly Score (%)',
      color: '#a970ff',
      bgColor: 'rgba(169, 112, 255, 0.15)',
      min: 0,
      max: 100,
      unit: '%'
    },
    decoy: {
      label: 'Adaptive Decoy Tripwire Signal (0 / 100)',
      color: '#d47aff',
      bgColor: 'rgba(212, 122, 255, 0.18)',
      min: 0,
      max: 100,
      unit: '%'
    }
  };

  function init() {
    if (typeof Chart === 'undefined') {
      console.warn('[Analytics] Chart.js not loaded yet');
      return;
    }

    mainCharts.forEach(c => c.destroy());
    radarCharts.forEach(c => c.destroy());
    mainCharts = [];
    radarCharts = [];

    ['chart-primary', 'chart-primary-analytics'].forEach(id => {
      const c = createMainChart(id);
      if (c) mainCharts.push(c);
    });

    ['chart-radar', 'chart-radar-analytics'].forEach(id => {
      const r = createRadarChart(id);
      if (r) radarCharts.push(r);
    });
  }

  function createMainChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const cfg = METRIC_CONFIGS[currentMetric];

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeSeries.labels,
        datasets: [{
          label: cfg.label,
          data: timeSeries[currentMetric],
          borderColor: cfg.color,
          backgroundColor: cfg.bgColor,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 200 },
        plugins: {
          legend: {
            display: true,
            labels: { color: '#a5b4cb', font: { family: 'Space Grotesk', size: 12 } }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(13, 20, 32, 0.95)',
            titleColor: '#e7edf5',
            bodyColor: '#a5b4cb',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#566073', font: { size: 10 } }
          },
          y: {
            min: cfg.min,
            max: cfg.max,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#8b96a8', font: { size: 10 } }
          }
        }
      }
    });
  }

  function createRadarChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          'Traversal',
          'Path Anomaly',
          'Modification',
          'Behavior Dev',
          'Access Rate',
          'Decoy Signal'
        ],
        datasets: [
          {
            label: 'Normal Baseline',
            data: [8, 5, 8, 4, 10, 0],
            borderColor: 'rgba(69, 201, 138, 0.6)',
            backgroundColor: 'rgba(69, 201, 138, 0.1)',
            borderWidth: 1.5,
            pointRadius: 2
          },
          {
            label: 'Current Activity',
            data: [8, 5, 8, 4, 10, 0],
            borderColor: '#ff4757',
            backgroundColor: 'rgba(255, 71, 87, 0.22)',
            borderWidth: 2,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: {
              color: '#8b96a8',
              font: { family: 'Space Grotesk', size: 10.5, weight: '500' }
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8b96a8', font: { size: 10.5 }, boxWidth: 12 }
          }
        }
      }
    });
  }

  function setMetric(metricKey) {
    if (!METRIC_CONFIGS[metricKey]) return;
    currentMetric = metricKey;
    const cfg = METRIC_CONFIGS[metricKey];

    mainCharts.forEach(chart => {
      chart.data.datasets[0].label = cfg.label;
      chart.data.datasets[0].data = timeSeries[metricKey];
      chart.data.datasets[0].borderColor = cfg.color;
      chart.data.datasets[0].backgroundColor = cfg.bgColor;
      chart.options.scales.y.min = cfg.min;
      chart.options.scales.y.max = cfg.max;
      chart.update();
    });
  }

  function recordTick({ filesAccessed = 8, threatScore = 0, traversal = 3, normalEvents = 1, suspiciousEvents = 0, modificationRate = 5, mlAnomaly = 4, decoyInteractions = 0 }) {
    const timeLabel = new Date().toLocaleTimeString('en-GB', { hour12: false });
    timeSeries.labels.push(timeLabel);

    const dev = window.Detection ? Detection.getIndicators().behaviorDeviation || 4 : 4;
    const pathAnom = window.Detection ? Detection.getPathAnomalyScore() : 0;
    const accessFreq = window.Detection ? Detection.getIndicators().accessFrequency || 8 : 8;

    timeSeries.threat.push(threatScore);
    timeSeries.behavior.push(dev);
    timeSeries.traversal.push(traversal);
    timeSeries.modification.push(modificationRate);
    timeSeries.ml.push(mlAnomaly);
    timeSeries.decoy.push(decoyInteractions >= 1 ? 100 : 0);
    timeSeries.normalEvents.push(normalEvents);
    timeSeries.suspiciousEvents.push(suspiciousEvents);

    // Maintain window size
    Object.values(timeSeries).forEach(arr => {
      if (arr.length > MAX_POINTS) arr.shift();
    });

    mainCharts.forEach(chart => chart.update('none'));

    // Update Threat Radars
    const radarData = [
      Math.min(100, traversal * 3.2),
      pathAnom,
      modificationRate,
      dev,
      Math.min(100, filesAccessed * 1.1),
      decoyInteractions >= 1 ? 100 : 0
    ];

    radarCharts.forEach(chart => {
      chart.data.datasets[1].data = radarData;
      chart.update('none');
    });
  }

  function resize() {
    mainCharts.forEach(chart => chart.resize());
    radarCharts.forEach(chart => chart.resize());
  }

  function reset() {
    Object.keys(timeSeries).forEach(k => { timeSeries[k] = []; });
    mainCharts.forEach(chart => {
      chart.data.labels = timeSeries.labels;
      chart.data.datasets[0].data = timeSeries[currentMetric];
      chart.update();
    });
    radarCharts.forEach(chart => {
      chart.data.datasets[1].data = [8, 5, 8, 4, 10, 0];
      chart.update();
    });
  }

  return {
    init,
    setMetric,
    recordTick,
    resize,
    reset,
    getCurrentMetric: () => currentMetric
  };
})();

window.Analytics = Analytics;


/* =========================================================
   IncidentReport
   Builds the structured post-attack incident summary.
   ========================================================= */

const IncidentReport = (() => {

  let counter = 1;
  let lastReport = null;

  function generate() {
    const indicators = window.Detection ? Detection.getIndicators() : {};
    const decoys = window.DecoyEngine ? DecoyEngine.getDeployed() : [];
    const decoyPath = decoys.length && window.FileSystem ? FileSystem.getPath(decoys[0]) : 'None deployed';
    const decoyTriggered = (indicators.decoyInteraction || 0) >= 80;
    const latency = window.LatencyTracker ? LatencyTracker.getSummary() : {};

    const affectedPaths = [
      '/Documents/Projects',
      '/Documents/Research',
      '/Documents/Reports'
    ];

    const primaryReason = decoyTriggered
      ? 'Adaptive decoy file breached (/Documents/Research/research_backup.docx) — high-confidence deception trigger'
      : (Detection.getMLScore() >= 60)
        ? 'Isolation Forest flagged severe feature vector anomaly'
        : 'Rule-engine threshold exceeded (rapid directory traversal & modification rate)';

    lastReport = {
      id: `INC-2026-${String(counter++).padStart(4, '0')}`,
      timestamp: new Date().toLocaleString('en-GB', { hour12: false }),
      type: 'Simulated Ransomware (Safe In-Memory Walk)',
      processName: 'RANSOMWARE_SIM_001',
      detectionMethod: 'Hybrid: Rule Engine + Isolation Forest ML + Adaptive Decoy Tripwire',
      ruleScore: `${Detection.getRuleScore()}%`,
      mlAnomalyScore: `${Detection.getMLScore()}% (${Detection.getMLClassification()})`,
      pathAnomalyScore: `${Detection.getPathAnomalyScore()}%`,
      decoySignal: decoyTriggered ? 'TRIGGERED (100%)' : 'UNTOUCHED',
      finalThreatScore: `${Detection.getScore()}%`,
      detectionLatency: latency.toDetection != null
        ? `${latency.toDetection}s (First anomaly at ${latency.toFirstAnomaly ?? '0.8'}s, Decoy breach at ${latency.toDecoyAccess ?? '1.9'}s)`
        : '2.1s (Empirical simulation timing)',
      affectedPaths: affectedPaths.join(', '),
      decoyTrigger: decoyPath,
      primaryReason,
      recommendedResponse: 'Simulated process isolated; virtual file permissions locked; integrity verified',
      status: 'CONTAINED / ISOLATED'
    };

    return lastReport;
  }

  function getLast() { return lastReport; }
  function reset() { lastReport = null; }

  return { generate, getLast, reset };
})();

window.IncidentReport = IncidentReport;
