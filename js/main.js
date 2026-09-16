/* =========================================================
   main.js
   CYBERSPHERE DEFENSE 3D — Application Orchestrator
   Coordinates loading sequence, event subscribers, control
   bindings, camera transitions, and multi-cycle simulation resets.
   ========================================================= */

const App = (() => {

  const state = {
    rootId: null,
    mode: 'idle',       // 'idle' | 'normal' | 'attack' | 'guided' | 'replay'
    paused: false
  };

  function boot() {
    try {
      init();
    } catch (err) {
      console.error('[App] Initialization error:', err);
    }
    setupIntroSplash();
  }

  function setupIntroSplash() {
    const splash = document.getElementById('intro-splash');
    const app = document.getElementById('app');
    const progressFill = document.getElementById('intro-progress-fill');
    const statusText = document.getElementById('intro-status-text');
    const percentText = document.getElementById('intro-percent-text');
    const countdownEl = document.getElementById('intro-countdown');
    const btnEnter = document.getElementById('btn-intro-enter');

    if (!splash) {
      if (app) app.classList.remove('hidden');
      window.dispatchEvent(new Event('resize'));
      setTimeout(startAmbientLiveAction, 1000);
      return;
    }

    let entered = false;

    function enterOperationsCenter() {
      if (entered) return;
      entered = true;

      splash.classList.add('dismissed');
      setTimeout(() => {
        if (splash.parentNode) splash.remove();
      }, 650);

      if (app) {
        app.classList.remove('hidden');
        switchView('view-unified');
        window.dispatchEvent(new Event('resize'));
      }

      // Live Welcome Toast
      if (window.UI && UI.showToast) {
        UI.showToast(
          'PROJECT INITIALIZED',
          'AI-Based Adaptive Decoy File Generation for Early Ransomware Detection is active',
          'success',
          5000
        );
      }

      // Auto-start ambient live action after 1s
      setTimeout(startAmbientLiveAction, 1000);
    }

    if (btnEnter) {
      btnEnter.addEventListener('click', enterOperationsCenter);
    }

    // Keyboard trigger (Enter or Space)
    window.addEventListener('keydown', (e) => {
      if (!entered && (e.key === 'Enter' || e.key === ' ')) {
        enterOperationsCenter();
      }
    }, { once: true });

    // Smooth calibration sequence over 2.0s
    const stages = [
      { progress: 28, status: 'Building 3D filesystem topology (26 virtual nodes)…', delay: 200 },
      { progress: 60, status: 'Fitting in-browser Isolation Forest anomaly baseline…', delay: 700 },
      { progress: 88, status: 'Seeding adaptive decoy tripwires in high-risk sectors…', delay: 1200 },
      { progress: 100, status: 'Security perimeter shield active. Ready.', delay: 1700 }
    ];

    stages.forEach(st => {
      setTimeout(() => {
        if (entered) return;
        if (progressFill) progressFill.style.width = st.progress + '%';
        if (percentText) percentText.textContent = st.progress + '%';
        if (statusText) statusText.textContent = st.status;
      }, st.delay);
    });

    // Auto-countdown timer
    let remaining = 4;
    const countInterval = setInterval(() => {
      if (entered) {
        clearInterval(countInterval);
        return;
      }
      remaining--;
      if (countdownEl) countdownEl.textContent = remaining + 's';
      if (remaining <= 0) {
        clearInterval(countInterval);
        enterOperationsCenter();
      }
    }, 1000);
  }

  function startAmbientLiveAction() {
    if (state.mode === 'idle' && window.BehaviorEngine) {
      UI.logEvent('Auto-patrol: Monitoring background authorized user sessions', 'info');
      BehaviorEngine.start();
      state.mode = 'normal';
      document.querySelectorAll('#btn-normal, .dock-btn-normal').forEach(btn => {
        btn.classList.add('active');
        const textSpan = btn.querySelector('.dock-text');
        if (textSpan) textSpan.textContent = 'Stop Normal';
        else btn.textContent = '⏹️ Stop Normal';
      });
    }
  }

  function init() {
    // 1. Build Virtual Filesystem Graph
    const { rootId } = FileSystem.build();
    state.rootId = rootId;

    // 2. Initialize 3D Scene Environment
    const viewportEl = document.getElementById('viewport');
    SceneManager.init(viewportEl);
    SceneManager.buildFileSystem(rootId);
    SceneManager.setNodeClickHandler(handleNodeClick);
    SceneManager.setNodeHoverHandler(handleNodeHover);

    // 3. Initialize Analytics & Threat Radar
    Analytics.init();

    // 4. Train In-Browser ML Isolation Forest
    MLEngine.train();

    // 5. Connect Optional Python Backend
    BackendClient.connect();

    // 6. Start Adaptive Decoy Directory Watcher
    DecoyEngine.watch();
    UI.updateDecoyRiskRanking(DecoyEngine.computeRiskRanking());

    // 7. Reset Detection State & Metrics
    Detection.reset();

    // 8. Wire DOM Controls & EventBus
    wireControls();
    subscribeToEvents();
    startDecayLoop();

    UI.logEvent('CyberSphere Defense 3D online — Security shield active', 'info');
    UI.logEvent('Baseline user behavior initialized (Files: 8/min, Dirs: 3/min)', 'info');
    UI.logEvent('Isolation Forest anomaly detector fitted on normal dataset', 'info');
    UI.updateEducationalPanel({
      stepNumber: 1,
      totalSteps: 12,
      title: 'Virtual Cybersecurity Operations Center Online',
      text: 'The 3D filesystem graph is ready. You can explore normal user activity, deploy adaptive decoy tripwires, or run a simulated ransomware attack.'
    });
  }

  function handleNodeClick(nodeId) {
    const node = FileSystem.get(nodeId);
    if (!node) {
      UI.hideInspector();
      return;
    }
    UI.showInspector(node);
    SceneManager.focusOn(nodeId, node.type === 'root' ? 38 : 34);
  }

  function handleNodeHover(nodeId) {
    // Optional hover feedback
  }

  function trackFolderActivity(folderId) {
    // Folder activity incremented via FileSystem.touch(folderId)
  }

  function recordTraversal(node) {
    if (window.PathAnalysis) PathAnalysis.recordStep(node.id, 'Active');
  }

  function startDecayLoop() {
    setInterval(() => {
      if (state.mode !== 'attack' && !RansomwareSimulation.isRunning()) {
        Detection.decay();
      }
    }, 2800);
  }

  /* ---------------- Event Subscriptions ---------------- */

  function subscribeToEvents() {
    if (!window.EventBus) return;

    EventBus.on(EventBus.Events.FILE_ACCESSED, (data) => {
      // Data particle animation handled by behavior / ransomware engines
    });

    EventBus.on(EventBus.Events.DECOY_DEPLOYED, (data) => {
      UI.updateEducationalPanel({
        stepNumber: 7,
        totalSteps: 12,
        title: 'Adaptive Decoy Deployed',
        text: `Decoy file ${data.name} placed in high-risk directory ${data.folderName}. Any read/modify action will immediately trip the high-confidence alarm.`
      });
    });

    EventBus.on(EventBus.Events.DECOY_ACCESSED, (data) => {
      UI.updateEducationalPanel({
        stepNumber: 9,
        totalSteps: 12,
        title: '🚨 DECOY BREACHED — High-Confidence Tripwire Triggered',
        text: `Process ${data.process} touched decoy ${data.name}. The tripwire signal confirmed malicious directory traversal.`
      });
    });

    EventBus.on(EventBus.Events.INCIDENT_CONTAINED, (data) => {
      UI.updateEducationalPanel({
        stepNumber: 11,
        totalSteps: 12,
        title: 'Threat Contained — Process Isolated',
        text: `Simulated process ${data.process} was identified and quarantined within the virtual sandbox. No real files were touched.`
      });
    });
  }

  /* ---------------- Control Bindings ---------------- */

  function wireControls() {
    const $ = (id) => document.getElementById(id);
    const onAll = (selector, handler) => {
      document.querySelectorAll(selector).forEach(el => el.addEventListener('click', handler));
    };

    // Normal Activity (3D Dock + Shortcuts)
    onAll('#btn-normal, .btn-normal-trigger, .dock-btn-normal', () => {
      if (RansomwareSimulation.isRunning()) return;
      if (state.mode === 'normal') {
        BehaviorEngine.stop();
        state.mode = 'idle';
        UI.setSimBanner('idle', 'Normal user activity stopped');
        UI.setAIStatus('Idle — monitoring baseline');
        document.querySelectorAll('#btn-normal, .dock-btn-normal').forEach(b => {
          b.classList.remove('active');
          const t = b.querySelector('.dock-text');
          if (t) t.textContent = 'Normal User';
          else b.textContent = '👤 Normal User';
        });
      } else {
        state.mode = 'normal';
        BehaviorEngine.start();
        UI.setSimBanner('normal', 'Normal user activity active — generating baseline telemetry');
        UI.setAIStatus('Active: Analyzing authorized user file access…');
        document.querySelectorAll('#btn-normal, .dock-btn-normal').forEach(b => {
          b.classList.add('active');
          const t = b.querySelector('.dock-text');
          if (t) t.textContent = 'Stop Normal';
          else b.textContent = '⏹️ Stop Normal';
        });
      }
    });

    // Ransomware Simulation (3D Dock + Shortcuts)
    onAll('#btn-attack, .btn-attack-trigger, .dock-btn-attack', () => {
      if (RansomwareSimulation.isRunning()) return;
      if (state.mode === 'normal') {
        BehaviorEngine.stop();
        document.querySelectorAll('#btn-normal, .dock-btn-normal').forEach(b => {
          b.classList.remove('active');
          const t = b.querySelector('.dock-text');
          if (t) t.textContent = 'Normal User';
        });
      }
      state.mode = 'attack';
      document.querySelectorAll('#btn-attack, .btn-attack-trigger, .dock-btn-attack').forEach(b => {
        b.disabled = true;
        b.classList.add('active');
      });
      RansomwareSimulation.start();
    });

    // Guided Demo (12 steps)
    onAll('#btn-guided-demo, .btn-guided-trigger, .dock-btn-guided', () => {
      DemoGuide.startGuidedDemo();
    });

    // Step-by-Step Viva Navigation
    onAll('#btn-step-prev, .btn-step-prev', () => DemoGuide.prevStep());
    onAll('#btn-step-next, .btn-step-next', () => DemoGuide.nextStep());

    // Replay Mode
    onAll('#btn-replay-1x, .btn-replay-1x', () => DemoGuide.startReplay(1.0));
    onAll('#btn-replay-2x, .btn-replay-2x', () => DemoGuide.startReplay(2.0));

    // Adaptive Decoy Deployment (3D Dock + Recommendation)
    onAll('#btn-deploy-decoy, .btn-decoy-trigger, .dock-btn-decoy', () => {
      const decoy = DecoyEngine.deployToRecommended() || DecoyEngine.deployToResearchDefault();
      if (decoy) SceneManager.focusOn(decoy.id, 36);
    });

    onAll('#btn-deploy-decoy-rec', () => {
      const decoy = DecoyEngine.deployToRecommended();
      if (decoy) SceneManager.focusOn(decoy.id, 36);
    });

    // Pause / Resume (3D Dock)
    onAll('#btn-pause, .btn-pause-trigger, .dock-btn-pause', () => {
      if (!RansomwareSimulation.isRunning() && state.mode !== 'attack') return;
      const isPaused = RansomwareSimulation.pause();
      document.querySelectorAll('#btn-pause, .btn-pause-trigger, .dock-btn-pause').forEach(btn => {
        btn.classList.toggle('active', isPaused);
        const t = btn.querySelector('.dock-text');
        if (t) t.textContent = isPaused ? 'Resume' : 'Pause';
        else btn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
      });
    });

    // Reset Environment
    onAll('#btn-reset, .btn-reset-trigger, .dock-btn-reset', resetEnvironment);
    onAll('#btn-reset-from-incident', () => {
      UI.closeIncidentModal();
      resetEnvironment();
    });

    // Camera Navigation Presets
    onAll('#btn-cam-overview, .btn-cam-overview', () => SceneManager.resetCamera());
    onAll('#btn-cam-orbit, .btn-cam-orbit', () => {
      const isOrbiting = SceneManager.toggleAutoOrbit();
      document.querySelectorAll('#btn-cam-orbit, .btn-cam-orbit').forEach(btn => {
        btn.classList.toggle('active', isOrbiting);
        btn.innerHTML = isOrbiting ? '⏸️ Stop' : '🎥 Orbit';
      });
    });
    onAll('#btn-cam-ai, .btn-cam-ai', () => SceneManager.focusOnAICore());
    onAll('#btn-cam-decoy, .btn-cam-decoy', () => SceneManager.focusOnDecoy());
    onAll('#btn-cam-proc, .btn-cam-proc', () => SceneManager.focusOnProcess());
    onAll('#btn-cam-reset, .btn-cam-reset', () => SceneManager.resetCamera());

    onAll('#btn-audio-toggle', () => {
      if (window.AudioEngine) {
        const isMuted = AudioEngine.toggleMute();
        document.querySelectorAll('#btn-audio-toggle').forEach(btn => {
          btn.textContent = isMuted ? '🔇 SFX OFF' : '🔊 SFX ON';
          btn.classList.toggle('muted', isMuted);
        });
      }
    });

    // Full-Page 3D Animation Mode Toggles
    const toggleFullPage3D = () => {
      const currentActive = document.querySelector('.view-panel.active')?.id;
      if (currentActive === 'view-3d') {
        switchView('view-unified');
        if (window.UI && UI.showToast) {
          UI.showToast('COMMAND CENTER ACTIVE', 'Unified SOC mode with all monitoring panels and telemetry visible', 'info', 3000);
        }
      } else {
        switchView('view-3d');
        if (window.UI && UI.showToast) {
          UI.showToast('🌌 FULL-PAGE 3D ANIMATION', 'Immersive full-screen 3D virtual environment active', 'success', 3000);
        }
      }
    };

    $('btn-toggle-fullpage-3d')?.addEventListener('click', toggleFullPage3D);
    $('btn-expand-vp-unified')?.addEventListener('click', () => switchView('view-3d'));
    $('btn-expand-vp-hero')?.addEventListener('click', () => switchView('view-unified'));
    onAll('.btn-expand-vp-trigger', (e) => {
      if (e.currentTarget.id === 'btn-expand-vp-unified') switchView('view-3d');
      else if (e.currentTarget.id === 'btn-expand-vp-hero') switchView('view-unified');
    });

    // 3D Legend Dropdown Toggle
    $('btn-legend-toggle')?.addEventListener('click', () => {
      const card = $('legend-card');
      const arrow = $('legend-arrow');
      if (card) {
        card.classList.toggle('open');
        if (arrow) arrow.textContent = card.classList.contains('open') ? '▴' : '▾';
      }
    });

    // Educational Panel Minimize / Expand Toggle
    $('edu-toggle-btn')?.addEventListener('click', () => {
      const card = $('edu-card');
      const btn = $('edu-toggle-btn');
      if (card) {
        card.classList.toggle('minimized');
        if (btn) btn.textContent = card.classList.contains('minimized') ? '+' : '−';
      }
    });

    // Quick Scroll Links
    $('btn-view-path')?.addEventListener('click', () => UI.scrollToPanel('path-panel'));
    $('btn-view-behavior')?.addEventListener('click', () => UI.scrollToPanel('behavior-panel'));
    $('btn-view-incident')?.addEventListener('click', () => {
      const report = IncidentReport.getLast() || IncidentReport.generate();
      UI.renderIncident(report);
      UI.openIncidentModal();
    });

    // Inspectors and Modals
    $('inspector-close')?.addEventListener('click', UI.hideInspector);
    $('incident-close')?.addEventListener('click', UI.closeIncidentModal);
    $('alert-close')?.addEventListener('click', UI.hideAlert);
    $('alert-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'alert-modal') UI.hideAlert();
    });

    // Alert Actions
    $('btn-isolate')?.addEventListener('click', () => {
      UI.logEvent('Containment: Simulated process isolated', 'success');
      UI.hideAlert();
      RansomwareSimulation.stop();
      SceneManager.isolateProcess();
      $('btn-attack').disabled = false;
    });

    $('btn-stop-sim')?.addEventListener('click', () => {
      UI.hideAlert();
      RansomwareSimulation.stop();
      $('btn-attack').disabled = false;
    });

    $('btn-open-incident')?.addEventListener('click', () => {
      UI.hideAlert();
      const report = IncidentReport.getLast() || IncidentReport.generate();
      UI.renderIncident(report);
      UI.openIncidentModal();
    });

    // Experiment Mode
    $('btn-experiment')?.addEventListener('click', () => UI.openExperimentModal());
    $('experiment-close')?.addEventListener('click', UI.closeExperimentModal);
    $('btn-run-experiment')?.addEventListener('click', () => {
      const runs = Experiment.runAll();
      UI.renderExperimentResults(runs);
      UI.logEvent(`Experiment Mode: ${runs.length} synthetic scenarios evaluated with genuine math`, 'info');
    });

    // ML Evaluation
    $('btn-ml-eval')?.addEventListener('click', () => UI.openMLEvalModal());
    $('ml-eval-close')?.addEventListener('click', UI.closeMLEvalModal);
    $('btn-run-ml-eval')?.addEventListener('click', () => {
      const metrics = MLEvaluation.run();
      UI.renderMLEvaluation(metrics);
      UI.logEvent(`ML Evaluation: Precision ${metrics.precision}, Recall ${metrics.recall}, F1 ${metrics.f1}`, 'info');
    });

    // Analytics Metric Switchers (Section 40)
    const metricBtns = ['threat', 'behavior', 'traversal', 'modification', 'ml', 'decoy'];
    metricBtns.forEach(m => {
      const b = $(`btn-metric-${m}`);
      if (b) {
        b.addEventListener('click', () => {
          metricBtns.forEach(other => $(`btn-metric-${other}`)?.classList.remove('active'));
          b.classList.add('active');
          Analytics.setMetric(m);
        });
      }
    });

    // Primary Multi-View Tab Navigation
    const tabBtns = document.querySelectorAll('.nav-tab');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        switchView(viewId);
      });
    });

    // Keyboard Shortcuts for Rapid View Switching
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '1') switchView('view-unified');
      if (e.key === '2') switchView('view-3d');
      if (e.key === '3') switchView('view-analytics');
      if (e.key === '4') switchView('view-forensics');
      if (e.key === '5') switchView('view-research');
      if (e.key === 'f' || e.key === 'F') {
        const cur = document.querySelector('.view-panel.active')?.id;
        switchView(cur === 'view-3d' ? 'view-unified' : 'view-3d');
      }
    });

    // Cyber Controls Drawer Toggle (Viva Steps, Replay, Tools)
    onAll('#btn-toggle-drawer, .btn-toggle-drawer', () => {
      document.querySelectorAll('.controls-drawer').forEach(d => d.classList.toggle('open'));
    });
    onAll('#drawer-close, .drawer-close', () => {
      document.querySelectorAll('.controls-drawer').forEach(d => d.classList.remove('open'));
    });

    // Academic Research View Direct Triggers
    $('btn-ml-eval-view')?.addEventListener('click', () => UI.openMLEvalModal());
    $('btn-experiment-view')?.addEventListener('click', () => UI.openExperimentModal());
  }

  function switchView(viewId) {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.view-panel');

    tabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-view') === viewId);
    });

    panels.forEach(p => {
      p.classList.toggle('active', p.id === viewId);
    });

    // Update Topbar Full-Page 3D Animation Button
    const topbarToggle = document.getElementById('btn-toggle-fullpage-3d');
    if (topbarToggle) {
      if (viewId === 'view-3d') {
        topbarToggle.classList.add('active-fullpage');
        topbarToggle.innerHTML = '<span class="mode-icon">⭐</span><span class="mode-text">SPLIT COMMAND VIEW</span>';
        topbarToggle.title = 'Return to Unified Split Command Center with all panels (Shortcut: F or 1)';
      } else {
        topbarToggle.classList.remove('active-fullpage');
        topbarToggle.innerHTML = '<span class="mode-icon">🌌</span><span class="mode-text">FULL-PAGE 3D ANIMATION</span>';
        topbarToggle.title = 'Switch to Full-Page 3D Animation Mode (Shortcut: F or 2)';
      }
    }

    // Viewport & Drawer Docking: Seamlessly move between Unified and Hero views
    const vp = document.getElementById('viewport');
    const unifiedSlot = document.getElementById('unified-viewport-slot');
    const heroSlot = document.getElementById('hero-viewport-slot');
    const drawer = document.getElementById('controls-drawer');
    const unifiedWrap = document.querySelector('#view-unified .viewport-wrap');
    const heroWrap = document.getElementById('viewport-wrap');

    if (viewId === 'view-unified') {
      if (unifiedSlot && vp && vp.parentElement !== unifiedSlot) {
        unifiedSlot.appendChild(vp);
      }
      if (unifiedWrap && drawer && drawer.parentElement !== unifiedWrap) {
        unifiedWrap.appendChild(drawer);
      }
    } else if (viewId === 'view-3d') {
      if (heroSlot && vp && vp.parentElement !== heroSlot) {
        heroSlot.appendChild(vp);
      }
      if (heroWrap && drawer && drawer.parentElement !== heroWrap) {
        heroWrap.appendChild(drawer);
      }
    }

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      if (window.SceneManager && typeof SceneManager.onResize === 'function') {
        SceneManager.onResize();
      }
      if (window.Analytics && typeof Analytics.resize === 'function') {
        Analytics.resize();
      }
    }, 60);
  }

  function resetEnvironment() {
    BehaviorEngine.reset();
    RansomwareSimulation.reset();
    Detection.reset();
    DecoyEngine.reset();
    Analytics.reset();
    IncidentReport.reset();
    DemoGuide.stopGuidedDemo();
    DemoGuide.stopReplay();

    UI.clearEventFeed();
    UI.hideInspector();
    UI.hideSimBanner();
    UI.hideAlert();
    UI.enableIncidentButton(false);
    UI.updateBehaviorMetrics(BehaviorEngine.getMetrics(), BehaviorEngine.getBaseline());
    UI.updatePathAnalysis({ source: 'Idle', current: '/', trace: [] });
    UI.setAIStatus('Idle — waiting for activity');

    const { rootId } = FileSystem.build();
    state.rootId = rootId;
    state.mode = 'idle';

    document.querySelectorAll('#btn-attack, .btn-attack-trigger, .dock-btn-attack').forEach(b => {
      b.disabled = false;
      b.classList.remove('active');
    });
    document.querySelectorAll('#btn-normal, .btn-normal-trigger, .dock-btn-normal').forEach(b => {
      b.disabled = false;
      b.classList.remove('active');
      const t = b.querySelector('.dock-text');
      if (t) t.textContent = 'Normal User';
      else b.textContent = '👤 Normal User';
    });
    document.querySelectorAll('#btn-pause, .btn-pause-trigger, .dock-btn-pause').forEach(b => {
      b.classList.remove('active');
      const t = b.querySelector('.dock-text');
      if (t) t.textContent = 'Pause';
      else b.textContent = '⏸️ Pause';
    });

    SceneManager.buildFileSystem(rootId);
    SceneManager.resetCamera();
    SceneManager.updateSecurityShield('normal');
    DecoyEngine.watch();
    UI.updateDecoyRiskRanking(DecoyEngine.computeRiskRanking());

    UI.logEvent('Environment reset — baseline restored', 'info');
  }

  return {
    boot,
    state,
    resetEnvironment,
    trackFolderActivity,
    recordTraversal,
    switchView
  };
})();

window.App = App;
window.addEventListener('DOMContentLoaded', App.boot);
