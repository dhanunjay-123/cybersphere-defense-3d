/* =========================================================
   ui.js
   CYBERSPHERE DEFENSE 3D — User Interface & HUD Controller
   Handles all DOM bindings, live telemetry tables,
   inspectors (Folder, File, Process), educational panels,
   timeline feeds, and interactive modals.
   ========================================================= */

const UI = (() => {

  const el = (id) => document.getElementById(id);

  // Status Badge mappings
  const SYSTEM_STATUSES = {
    normal:     { text: 'SYSTEM NORMAL',        cls: 'status-normal',     icon: '🟢' },
    anomaly:    { text: 'ANOMALY DETECTED',     cls: 'status-anomaly',    icon: '🟡' },
    suspicious: { text: 'SUSPICIOUS ACTIVITY',  cls: 'status-suspicious', icon: '🟠' },
    suspected:  { text: 'RANSOMWARE SUSPECTED', cls: 'status-suspected',  icon: '🔴' },
    detected:   { text: 'RANSOMWARE DETECTED',  cls: 'status-detected',   icon: '🚨' },
    contained:  { text: 'INCIDENT CONTAINED',   cls: 'status-contained',  icon: '🔵' }
  };

  /* ---------------- Cyber Toast Notification Stack ---------------- */

  function showToast(title, message, severity = 'info', duration = 4200) {
    const container = document.getElementById('cyber-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `cyber-toast sev-${severity}`;

    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    let icon = 'ℹ️';
    if (severity === 'warn') icon = '⚠️';
    else if (severity === 'danger') icon = '🚨';
    else if (severity === 'success') icon = '🛡️';

    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-tag">${icon} ${title || 'LIVE CYBER TELEMETRY'}</span>
        <span class="toast-time">${time}</span>
      </div>
      <div class="toast-body">${message}</div>
      <div class="toast-countdown" style="animation-duration: ${duration}ms;"></div>
    `;

    toast.style.cursor = 'pointer';
    toast.title = 'Click to dismiss';
    toast.addEventListener('click', () => {
      toast.classList.add('dismissing');
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 200);
    });

    container.appendChild(toast);

    while (container.children.length > 4) {
      container.removeChild(container.firstChild);
    }

    setTimeout(() => {
      toast.classList.add('dismissing');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 350);
    }, duration);
  }

  /* ---------------- Live Action Ticker Strip ---------------- */

  function setLiveAction(text, badge = 'LIVE MONITORING') {
    const msgEl = document.getElementById('ticker-message');
    const badgeEl = document.getElementById('ticker-badge');
    const timeEl = document.getElementById('ticker-time');

    if (msgEl) {
      msgEl.textContent = text;
      msgEl.classList.remove('flash');
      void msgEl.offsetWidth; // trigger reflow
      msgEl.classList.add('flash');
    }
    if (badgeEl && badge) {
      badgeEl.textContent = badge.toUpperCase();
    }
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    }
  }

  /* ---------------- Timeline & Logging ---------------- */

  function logEvent(text, severity = 'info') {
    const feeds = document.querySelectorAll('#event-feed, #event-feed-unified, .event-feed-target');

    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

    let icon = '•';
    if (severity === 'info') icon = 'ℹ️';
    else if (severity === 'warn') icon = '⚠️';
    else if (severity === 'danger') icon = '🚨';
    else if (severity === 'success') icon = '🛡️';

    if (feeds && feeds.length > 0) {
      feeds.forEach(feed => {
        const item = document.createElement('div');
        item.className = `event-item sev-${severity}`;
        item.innerHTML = `
          <span class="event-time">${time}</span>
          <span class="event-icon">${icon}</span>
          <span class="event-text">${text}</span>
        `;
        feed.appendChild(item);
        while (feed.children.length > 80) feed.removeChild(feed.firstChild);
        feed.scrollTop = feed.scrollHeight;
      });
    }

    addAILogLine(text);

    // Update Live Action Ticker strip
    const badge = severity === 'danger' ? 'CRITICAL THREAT' :
                  severity === 'warn' ? 'ANOMALY DETECTED' :
                  severity === 'success' ? 'PROTECTION ARMED' : 'LIVE MONITORING';
    setLiveAction(text, badge);

    // Trigger Cyber Toast notifications for important events
    if (severity === 'danger' || severity === 'success' || severity === 'warn') {
      const tagTitle = severity === 'danger' ? 'THREAT INTERCEPTION' :
                       severity === 'warn' ? 'BEHAVIOR ANOMALY' : 'SECURITY SHIELD';
      showToast(tagTitle, text, severity);
    }
  }

  function addAILogLine(text) {
    const logs = document.querySelectorAll('#ai-core-log, #ai-core-log-forensics');
    logs.forEach(log => {
      const line = document.createElement('div');
      line.className = 'ai-log-line active';
      line.textContent = `› ${text}`;
      log.appendChild(line);
      while (log.children.length > 8) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
      Array.from(log.children).forEach((c, i, arr) => {
        c.classList.toggle('active', i === arr.length - 1);
      });
    });
  }

  function setAIStatus(text) {
    document.querySelectorAll('#ai-core-status, #ai-core-status-forensics').forEach(s => {
      s.textContent = text;
    });
  }

  /* ---------------- System Status & Threat Score ---------------- */

  function updateSystemStatus(stateKey) {
    const cfg = SYSTEM_STATUSES[stateKey] || SYSTEM_STATUSES.normal;
    document.querySelectorAll('#system-status-badge, .system-status-pill').forEach(badge => {
      badge.className = `system-status-pill ${cfg.cls}`;
      badge.innerHTML = `<span class="status-dot"></span><span>${cfg.icon} ${cfg.text}</span>`;
    });
  }

  function updateThreatScore(score, label, bandKey) {
    document.querySelectorAll('#threat-score-value, .hud-threat-val, .score-value').forEach(scoreVal => {
      scoreVal.innerHTML = `${score}<span>%</span>`;
    });

    document.querySelectorAll('#threat-score-band, .score-band').forEach(scoreBand => {
      scoreBand.textContent = label;
    });

    document.querySelectorAll('#threat-score-fill, .score-bar-fill').forEach(fill => {
      fill.style.width = `${score}%`;
    });

    document.querySelectorAll('#threat-score-card, .hud-threat-pill').forEach(card => {
      if (card.classList.contains('hud-threat-pill')) {
        card.className = 'hud-threat-pill level-' + bandKey;
      } else {
        card.className = 'viewport-overlay top-right level-' + bandKey;
      }
    });

    document.querySelectorAll('#threat-chip, .threat-chip').forEach(chip => {
      chip.className = 'status-chip threat-chip level-' + bandKey;
      const lbl = chip.querySelector('#threat-level-label, .chip-value');
      if (lbl) lbl.textContent = `${score}% (${label})`;
    });

    const rootVal = document.getElementById('threat-level-label');
    if (rootVal) rootVal.textContent = `${score}% (${label})`;
  }

  function setSimBanner(kind, text) {
    const banner = el('sim-banner');
    if (!banner) return;
    banner.style.display = 'block';
    banner.className = `viewport-overlay bottom-center sim-banner banner-${kind}`;
    banner.innerHTML = `<span class="sim-banner-inner">${text}</span>`;
  }

  function hideSimBanner() {
    const banner = el('sim-banner');
    if (banner) banner.style.display = 'none';
  }

  /* ---------------- Active Process Panel ---------------- */

  function updateProcessDetails(state) {
    document.querySelectorAll('#current-proc-name, .proc-name-sync').forEach(nameEl => {
      if (state.type === 'ransomware') {
        nameEl.textContent = 'Adversarial Process (PID 9104)';
        nameEl.className = 'proc-name proc-danger';
      } else if (state.type === 'user') {
        nameEl.textContent = 'User Process (PID 4821)';
        nameEl.className = 'proc-name proc-normal';
      } else {
        nameEl.textContent = 'Idle System Monitor';
        nameEl.className = 'proc-name';
      }
    });

    document.querySelectorAll('#current-proc-status, .proc-status-sync').forEach(statusTag => {
      if (state.type === 'ransomware') {
        statusTag.textContent = state.isIsolated ? 'CONTAINED / ISOLATED' : 'MALICIOUS (THREAT)';
        statusTag.className = 'proc-status-tag ' + (state.isIsolated ? 'tag-contained' : 'tag-danger');
      } else if (state.type === 'user') {
        statusTag.textContent = 'ACTIVE (NORMAL)';
        statusTag.className = 'proc-status-tag tag-normal';
      } else {
        statusTag.textContent = 'STANDBY';
        statusTag.className = 'proc-status-tag tag-normal';
      }
    });

    document.querySelectorAll('#current-proc-type, .proc-type-sync').forEach(typeEl => {
      if (state.type === 'ransomware') typeEl.textContent = 'Adversarial Encryptor';
      else if (state.type === 'user') typeEl.textContent = 'Authorized User Session';
      else typeEl.textContent = 'Kernel Background Daemon';
    });

    document.querySelectorAll('#current-proc-activity, .proc-activity-sync').forEach(actEl => {
      if (state.type === 'ransomware') actEl.textContent = state.isIsolated ? 'TERMINATED' : 'EXTREME / AGGRESSIVE';
      else if (state.type === 'user') actEl.textContent = 'STEADY / LOW';
      else actEl.textContent = 'IDLE';
    });
  }

  /* ---------------- Baseline Comparison Table ---------------- */

  function updateBehaviorMetrics(metrics) {
    updateComparisonTable(metrics);
  }

  function updateComparisonTable(metrics) {
    if (!metrics) return;
    setCompRow('comp-files', `${metrics.filesPerMin || 8} files/min`);
    setCompRow('comp-dirs', `${metrics.dirChangesPerMin || 3} dirs/min`);
    setCompRow('comp-mod', metrics.modRate || 'Low');
    setCompRow('comp-trav', (metrics.dirChangesPerMin || 3) > 10 ? 'HIGH' : 'LOW');
    setCompRow('comp-dev', `${Math.round(metrics.anomaly || 4)}%`);
  }

  function setCompRow(rowId, curVal) {
    const curEls = document.querySelectorAll(`#${rowId}-cur, #${rowId}-cur-analytics, #${rowId}-cur-forensics`);
    curEls.forEach(curEl => {
      const isHigher = curVal === 'HIGH' || curVal === 'VERY HIGH';
      curEl.innerHTML = `${curVal} ${isHigher ? '<span class="up-arrow">↑</span>' : ''}`;
      curEl.className = isHigher ? 'comp-val alert' : 'comp-val';
    });
  }

  /* ---------------- File Path Analysis ---------------- */

  function updatePathAnalysis({ source, current, trace }) {
    document.querySelectorAll('#path-source, #path-source-forensics').forEach(el => el.textContent = source);
    document.querySelectorAll('#path-current, #path-current-forensics').forEach(el => el.textContent = current);

    // Breadcrumbs HUD overlay
    const breadcrumbEls = document.querySelectorAll('#hud-breadcrumbs, .hud-breadcrumbs');
    if (breadcrumbEls && window.PathAnalysis) {
      const bc = PathAnalysis.getBreadcrumbString();
      breadcrumbEls.forEach(b => {
        b.innerHTML = `<span>Active:</span> <b>${bc}</b>`;
      });
    }

    const containers = document.querySelectorAll('#path-trace, #path-trace-forensics');
    containers.forEach(container => {
      container.innerHTML = '';
      (trace || []).forEach(step => {
        const div = document.createElement('div');
        div.className = `path-step ${step.cls}`;
        div.textContent = step.name || step.label;
        container.appendChild(div);
      });
    });
  }

  /* ---------------- Educational Explanation Panel ---------------- */

  function updateEducationalPanel({ stepNumber, totalSteps, title, text }) {
    document.querySelectorAll('#edu-stage-title, .edu-title').forEach(t => t.textContent = title);
    document.querySelectorAll('#edu-stage-text, .edu-text').forEach(t => t.textContent = text);
    document.querySelectorAll('#edu-step-pill, .edu-pill').forEach(p => {
      if (stepNumber) p.textContent = `Stage ${stepNumber}/${totalSteps}`;
    });
  }

  /* ---------------- Decoy Recommendation & Ranking ---------------- */

  function showDecoyRecommendation(recData) {
    const panels = document.querySelectorAll('#decoy-recommend-panel, #decoy-recommend-panel-forensics');
    panels.forEach(p => p.style.display = '');

    document.querySelectorAll('#rec-path, #rec-path-forensics').forEach(el => el.textContent = recData.path);
    document.querySelectorAll('#rec-activity, #rec-activity-forensics').forEach(el => el.textContent = `${recData.activity} (${recData.score}% Risk)`);

    const reasonsLists = document.querySelectorAll('#rec-reasons-list, #rec-reasons-list-forensics');
    if (reasonsLists && recData.reasons) {
      reasonsLists.forEach(reasonsList => {
        reasonsList.innerHTML = '';
        recData.reasons.forEach(r => {
          const li = document.createElement('li');
          li.textContent = r;
          reasonsList.appendChild(li);
        });
      });
    }

    document.querySelectorAll('#btn-deploy-decoy, #btn-deploy-decoy-dock').forEach(btn => btn.disabled = false);
  }

  function hideDecoyRecommendation() {
    document.querySelectorAll('#decoy-recommend-panel, #decoy-recommend-panel-forensics').forEach(p => p.style.display = 'none');
  }

  function updateDecoyRiskRanking(ranking) {
    const containers = document.querySelectorAll('#decoy-risk-list, #decoy-risk-list-forensics');
    containers.forEach(container => {
      container.innerHTML = '';
      ranking.forEach(r => {
        const row = document.createElement('div');
        row.className = 'risk-row';
        const hasDecoy = window.FileSystem && FileSystem.get(r.id)?.children
          .some(cid => FileSystem.get(cid)?.isDecoy);

        row.innerHTML = `
          <div class="risk-info">
            <span class="risk-name">${r.name}</span>
            ${hasDecoy ? '<span class="decoy-badge">DECOY DEPLOYED</span>' : ''}
          </div>
          <div class="risk-bar-track">
            <div class="risk-bar-fill" style="width:${r.score}%; background: ${r.score > 60 ? '#ff8a4d' : '#4f9dff'};"></div>
          </div>
          <span class="risk-score">${r.score}%</span>
        `;
        container.appendChild(row);
      });
    });
  }

  /* ---------------- Threat Fusion & Explainability ---------------- */

  function updateThreatBreakdown({ ruleScore, mlScore, mlClassification, decoyActive, pathAnomalyScore, finalScore }) {
    setBar('breakdown-rule', ruleScore);
    setBar('breakdown-ml', mlScore);
    setBar('breakdown-path', pathAnomalyScore);

    const decoyEl = el('breakdown-decoy-value');
    if (decoyEl) {
      decoyEl.textContent = decoyActive ? 'TRIPWIRE TRIGGERED (100%)' : 'INACTIVE (0%)';
      decoyEl.className = 'breakdown-value ' + (decoyActive ? 'decoy-active' : 'decoy-inactive');
    }

    const mlClassEl = el('breakdown-ml-class');
    if (mlClassEl) {
      mlClassEl.textContent = mlClassification;
      mlClassEl.className = 'ml-class-tag ' + (mlClassification === 'ANOMALOUS' ? 'anomalous' : 'normal-tag');
    }

    const finalEl = el('breakdown-final-value');
    if (finalEl) finalEl.textContent = `${finalScore}%`;

    // Update Top Metric Cards in Analytics view
    const mRule = el('metric-rule-top');
    if (mRule) mRule.textContent = `${Math.round(ruleScore)}%`;
    const mMl = el('metric-ml-top');
    if (mMl) mMl.textContent = `${Math.round(mlScore)}%`;
    const mPath = el('metric-path-top');
    if (mPath) mPath.textContent = `${Math.round(pathAnomalyScore)}%`;
    const mDecoy = el('metric-decoy-top');
    if (mDecoy) {
      mDecoy.textContent = decoyActive ? 'TRIPPED' : 'ARMED';
      mDecoy.style.color = decoyActive ? '#ff1744' : '#00e676';
    }
  }

  function setBar(prefix, value) {
    const valueEl = el(`${prefix}-value`);
    const barEl = el(`${prefix}-bar`);
    if (valueEl) valueEl.textContent = `${Math.round(value)}%`;
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  function updateExplainability(checks) {
    const containers = document.querySelectorAll('#explain-list, #explain-list-forensics');
    containers.forEach(container => {
      container.innerHTML = '';
      checks.forEach(c => {
        const row = document.createElement('div');
        row.className = 'explain-row ' + (c.active ? 'on' : 'off');
        row.innerHTML = `
          <span class="explain-mark">${c.active ? '✓' : '○'}</span>
          <div class="explain-body">
            <span class="explain-label">${c.label}</span>
            ${c.detail ? `<span class="explain-detail">${c.detail}</span>` : ''}
          </div>
        `;
        container.appendChild(row);
      });
    });
  }

  /* ---------------- Inspectors (Folder, File, Process) ---------------- */

  function showInspector(node) {
    const card = el('inspector-card');
    if (!card) return;
    card.style.display = '';

    let typeTitle = node.type.toUpperCase();
    if (node.isDecoy) typeTitle = 'ADAPTIVE DECOY FILE';
    else if (node.type === 'root') typeTitle = 'VIRTUAL COMPUTER PLATFORM';

    el('inspector-type').textContent = typeTitle;
    el('inspector-name').textContent = node.name;
    el('inspector-path').textContent = FileSystem.getPath(node.id);

    const meta = el('inspector-meta');
    meta.innerHTML = '';

    const rows = [];
    if (node.type === 'folder' || node.type === 'root') {
      rows.push(['Direct child items', node.children.length]);
      rows.push(['Activity frequency', `${Math.round(node.activity)}%`]);
      rows.push(['Access count', node.accessCount]);
      rows.push(['Decoy presence', node.children.some(cid => FileSystem.get(cid)?.isDecoy) ? 'ACTIVE' : 'NONE']);
    } else if (node.isDecoy) {
      rows.push(['File type', 'Adaptive Decoy Tripwire']);
      rows.push(['Status', node.accessCount > 0 ? 'BREACHED / TRIGGERED' : 'MONITORING ACTIVE']);
      rows.push(['Security tripwire', '100% High-Confidence Signal']);
      rows.push(['Interactions recorded', node.accessCount]);
    } else {
      rows.push(['File extension', `.${node.ext}`]);
      rows.push(['Access count', node.accessCount]);
      rows.push(['Modification state', node.accessCount > 2 ? 'MODIFIED' : 'INTACT']);
      rows.push(['Integrity', 'VIRTUAL OBJECT — SIMULATION ONLY']);
    }

    rows.forEach(([k, v]) => {
      const d = document.createElement('div');
      d.innerHTML = `<span>${k}</span><b>${v}</b>`;
      meta.appendChild(d);
    });
  }

  function hideInspector() {
    const card = el('inspector-card');
    if (card) card.style.display = 'none';
  }

  /* ---------------- Modals & Dialogs ---------------- */

  function setSimBanner(kind, text) {
    const banner = el('sim-banner');
    if (!banner) return;
    banner.style.display = '';
    banner.className = 'viewport-overlay bottom-center ' + kind;
    banner.innerHTML = `<span class="sim-banner-inner">${text}</span>`;
  }

  function hideSimBanner() {
    const banner = el('sim-banner');
    if (banner) banner.style.display = 'none';
  }

  function showAlert({ score, anomaly, latency, trigger = 'Adaptive Decoy Tripwire' }) {
    const alertScore = el('alert-fused-score') || el('alert-score');
    if (alertScore) alertScore.textContent = `${score}%`;

    const alertAnomaly = el('alert-deviation') || el('alert-anomaly');
    if (alertAnomaly) alertAnomaly.textContent = anomaly;

    const alertLatency = el('alert-latency');
    if (alertLatency) alertLatency.textContent = latency || '1.8s';

    const alertTrigger = el('alert-primary-trigger');
    if (alertTrigger) alertTrigger.textContent = trigger;

    const modal = el('alert-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function hideAlert() {
    const modal = el('alert-modal');
    if (modal) modal.classList.add('hidden');
  }

  function renderIncident(report) {
    const grid = el('incident-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const rows = [
      ['Incident ID', report.id],
      ['Timestamp', report.timestamp],
      ['Attack type', report.type],
      ['Target process', report.processName],
      ['Detection method', report.detectionMethod],
      ['Rule engine score', report.ruleScore],
      ['ML anomaly score', report.mlAnomalyScore],
      ['Path anomaly score', report.pathAnomalyScore],
      ['Adaptive decoy tripwire', report.decoySignal],
      ['Final threat score', report.finalThreatScore],
      ['Detection latency', report.detectionLatency],
      ['Affected virtual paths', report.affectedPaths],
      ['Decoy breached', report.decoyTrigger],
      ['Primary detection reason', report.primaryReason],
      ['Containment action', report.recommendedResponse],
      ['System status', report.status]
    ];

    rows.forEach(([k, v]) => {
      const d = document.createElement('div');
      d.innerHTML = `<span>${k}</span><b>${v}</b>`;
      grid.appendChild(d);
    });
  }

  function openIncidentModal() { el('incident-modal')?.classList.remove('hidden'); }
  function closeIncidentModal() { el('incident-modal')?.classList.add('hidden'); }

  function clearEventFeed() {
    const feed = el('event-feed');
    if (feed) feed.innerHTML = '';
    const log = el('ai-core-log');
    if (log) log.innerHTML = '';
  }

  function enableIncidentButton(enabled) {
    document.querySelectorAll('#btn-view-incident, .btn-view-incident').forEach(btn => {
      btn.disabled = !enabled;
    });
  }

  function enableAttackButton(enabled) {
    document.querySelectorAll('#btn-attack, .btn-attack-trigger, .dock-btn-attack').forEach(btn => {
      btn.disabled = !enabled;
      if (enabled) btn.classList.remove('active');
    });
  }

  function setMLBackendStatus(connected) {
    const chip = el('ml-backend-chip');
    if (!chip) return;
    chip.textContent = connected ? '● BACKEND CONNECTED (Python scikit-learn)' : '● IN-BROWSER ML (Isolation Forest)';
    chip.className = 'status-chip ml-chip ' + (connected ? 'backend-on' : 'backend-off');
  }

  function updateLatency(summary) {
    const firstAnom = el('latency-first-anomaly');
    if (firstAnom) firstAnom.textContent = summary.toFirstAnomaly != null ? `${summary.toFirstAnomaly}s` : '—';

    const decoyAcc = el('latency-decoy');
    if (decoyAcc) decoyAcc.textContent = summary.toDecoyAccess != null ? `${summary.toDecoyAccess}s` : '—';

    const detected = el('latency-detected');
    if (detected) detected.textContent = summary.toDetection != null ? `${summary.toDetection}s` : '—';
  }

  /* ---------------- Experiment Mode & ML Eval ---------------- */

  function renderExperimentResults(runs) {
    const tbody = el('experiment-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    runs.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'result-' + r.detectionResult.toLowerCase().replace(/\s+/g, '-');
      tr.innerHTML = `
        <td><b>${r.runId}</b></td>
        <td>${r.behaviorType}</td>
        <td>${r.mlScore}%</td>
        <td>${r.threatScore}%</td>
        <td>${r.decoyTriggered ? 'Yes (Tripwire)' : 'No'}</td>
        <td><span class="badge-${r.detectionResult.includes('DETECTED') ? 'detected' : 'normal'}">${r.detectionResult}</span></td>
        <td>${r.detectionTime}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function openExperimentModal() { el('experiment-modal')?.classList.remove('hidden'); }
  function closeExperimentModal() { el('experiment-modal')?.classList.add('hidden'); }

  function renderMLEvaluation(metrics) {
    const grid = el('ml-eval-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const rows = [
      ['Dataset composition', `${metrics.samplesPerClass} Normal / ${metrics.samplesPerClass} Anomalous`],
      ['True positives (TP)', metrics.confusion.tp],
      ['False positives (FP)', metrics.confusion.fp],
      ['True negatives (TN)', metrics.confusion.tn],
      ['False negatives (FN)', metrics.confusion.fn],
      ['Precision', metrics.precision],
      ['Recall (Sensitivity)', metrics.recall],
      ['F1 Score', metrics.f1],
      ['False positive rate (FPR)', metrics.falsePositiveRate],
      ['Detection rate', metrics.detectionRate],
      ['Avg. detection latency', metrics.avgDetectionLatency]
    ];

    rows.forEach(([k, v]) => {
      const d = document.createElement('div');
      d.innerHTML = `<span>${k}</span><b>${v}</b>`;
      grid.appendChild(d);
    });
  }

  function openMLEvalModal() { el('ml-eval-modal')?.classList.remove('hidden'); }
  function closeMLEvalModal() { el('ml-eval-modal')?.classList.add('hidden'); }

  function scrollToPanel(id) {
    const p = el(id);
    if (p) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return {
    logEvent,
    showToast,
    setLiveAction,
    setAIStatus,
    updateSystemStatus,
    updateThreatScore,
    updateBehaviorMetrics,
    updateProcessDetails,
    updatePathAnalysis,
    updateEducationalPanel,
    showDecoyRecommendation,
    hideDecoyRecommendation,
    updateDecoyRiskRanking,
    updateThreatBreakdown,
    updateExplainability,
    showInspector,
    hideInspector,
    setSimBanner,
    hideSimBanner,
    showAlert,
    hideAlert,
    renderIncident,
    openIncidentModal,
    closeIncidentModal,
    clearEventFeed,
    enableIncidentButton,
    enableAttackButton,
    setMLBackendStatus,
    updateLatency,
    renderExperimentResults,
    openExperimentModal,
    closeExperimentModal,
    renderMLEvaluation,
    openMLEvalModal,
    closeMLEvalModal,
    scrollToPanel
  };
})();

window.UI = UI;
