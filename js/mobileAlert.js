/* =========================================================
   mobileAlert.js
   CYBERSPHERE DEFENSE 3D — Out-of-Band Mobile Incident Escalation
   Controls the on-screen Holographic Smartphone Widget and
   dispatches push notifications to physical phones via backend webhook
   ========================================================= */

const MobileAlertEngine = (() => {

  const STORAGE_KEY = 'cybersphere_mobile_webhook_v1';
  let config = {
    enabled: true,
    service: 'telegram',
    telegramToken: '',
    telegramChatId: '',
    webhookUrl: ''
  };

  function init() {
    loadSettings();
    setupEventListeners();
    updateClock();
    setInterval(updateClock, 1000);
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        config = { ...config, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('[MobileAlert] Could not load saved config:', e);
    }
  }

  function saveSettings(newConfig) {
    config = { ...config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
  }

  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const statusClock = document.getElementById('phone-status-time');
    const lockClock = document.getElementById('phone-clock-time');
    const lockDate = document.getElementById('phone-clock-date');

    if (statusClock) statusClock.textContent = timeStr;
    if (lockClock) lockClock.textContent = timeStr;
    if (lockDate) lockDate.textContent = dateStr;
  }

  function triggerAlert(data = {}) {
    const wrapper = document.getElementById('cyber-phone-wrapper');
    if (!wrapper) return;

    const title = data.title || 'CRITICAL: Ransomware Tripwire Breached!';
    const targetPath = data.targetPath || '/Documents/Research/research_backup.docx';
    const process = data.process || 'RANSOMWARE_SIM_001 (PID 9104)';
    const threatScore = data.threatScore || '72%';
    const latency = data.latency || '2.1s';
    const actionTaken = data.actionTaken || 'Sandboxed & Isolated in Sandbox';

    // Populate Phone DOM
    const titleEl = document.getElementById('phone-push-title');
    const pathEl = document.getElementById('phone-telemetry-target');
    const procEl = document.getElementById('phone-telemetry-proc');
    const threatEl = document.getElementById('phone-telemetry-threat');
    const latEl = document.getElementById('phone-telemetry-latency');
    const actEl = document.getElementById('phone-telemetry-action');

    if (titleEl) titleEl.textContent = title;
    if (pathEl) pathEl.textContent = targetPath;
    if (procEl) procEl.textContent = process;
    if (threatEl) threatEl.textContent = threatScore;
    if (latEl) latEl.textContent = latency;
    if (actEl) actEl.textContent = actionTaken;

    // Play mobile chime sound
    if (window.AudioEngine && AudioEngine.playPhoneChime) {
      AudioEngine.playPhoneChime();
    }

    // Slide phone into active view
    wrapper.classList.remove('minimized');
    wrapper.classList.add('active');

    // Log to SOC timeline
    if (window.UI && UI.logEvent) {
      UI.logEvent(`📱 Out-of-Band alert pushed to incident responder mobile device`, 'danger');
    }

    // Dispatch to Python Backend for real physical phone push
    dispatchToBackend({
      title,
      targetPath,
      process,
      threatScore,
      latency,
      actionTaken,
      timestamp: new Date().toISOString(),
      config
    });
  }

  async function dispatchToBackend(payload) {
    try {
      const host = window.location.hostname || 'localhost';
      const resp = await fetch(`http://${host}:8000/api/alert/mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const result = await resp.json();
        console.log('[MobileAlert] Backend push result:', result);
      }
    } catch (e) {
      // Offline fallback: purely client simulation without errors
      console.log('[MobileAlert] Backend offline; simulated on-screen delivery active.');
    }
  }

  function dismissPhone() {
    const wrapper = document.getElementById('cyber-phone-wrapper');
    if (wrapper) {
      wrapper.classList.remove('active');
      wrapper.classList.remove('minimized');
    }
  }

  function toggleMinimize() {
    const wrapper = document.getElementById('cyber-phone-wrapper');
    if (wrapper) {
      if (wrapper.classList.contains('minimized')) {
        wrapper.classList.remove('minimized');
      } else {
        wrapper.classList.add('minimized');
      }
    }
  }

  function openSettings() {
    const modal = document.getElementById('webhook-config-modal');
    if (!modal) return;

    // Fill inputs
    const svcSelect = document.getElementById('webhook-service-select');
    const tgToken = document.getElementById('webhook-tg-token');
    const tgChat = document.getElementById('webhook-tg-chat');
    const genUrl = document.getElementById('webhook-gen-url');

    if (svcSelect) svcSelect.value = config.service || 'simulation';
    if (tgToken) tgToken.value = config.telegramToken || '';
    if (tgChat) tgChat.value = config.telegramChatId || '';
    if (genUrl) genUrl.value = config.webhookUrl || '';

    updateSettingsVisibility();
    modal.classList.add('active');
  }

  function closeSettings() {
    const modal = document.getElementById('webhook-config-modal');
    if (modal) modal.classList.remove('active');
  }

  function updateSettingsVisibility() {
    const svcSelect = document.getElementById('webhook-service-select');
    const tgGroup = document.getElementById('webhook-tg-group');
    const urlGroup = document.getElementById('webhook-url-group');

    if (!svcSelect) return;
    const val = svcSelect.value;
    if (tgGroup) tgGroup.style.display = val === 'telegram' ? 'flex' : 'none';
    if (urlGroup) urlGroup.style.display = (val === 'discord' || val === 'generic') ? 'flex' : 'none';
  }

  function setupEventListeners() {
    // Dismiss button on phone
    document.getElementById('btn-phone-dismiss')?.addEventListener('click', dismissPhone);

    // Minimize toggle handle
    document.getElementById('phone-minimize-pill')?.addEventListener('click', toggleMinimize);

    // Quarantine button on phone
    document.getElementById('btn-phone-quarantine')?.addEventListener('click', () => {
      if (window.SceneManager && SceneManager.isolateProcess) {
        SceneManager.isolateProcess();
        SceneManager.updateSecurityShield('contained');
      }
      if (window.UI && UI.showToast) {
        UI.showToast('🛡️ HOST NETWORK ISOLATED', 'Workstation quarantined from central network fabric via Mobile Pager.', 'success');
      }
      dismissPhone();
    });

    // View Forensics button on phone
    document.getElementById('btn-phone-forensics')?.addEventListener('click', () => {
      const forensicsTab = document.querySelector('[data-view="view-forensics"]');
      if (forensicsTab) forensicsTab.click();
      dismissPhone();
    });

    // Topbar & Dock "📱 Phone Alert" trigger buttons
    document.querySelectorAll('.btn-trigger-phone-test').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerAlert({
          title: '🚨 DECOY TRIPWIRE BREACH (TEST)',
          targetPath: '/Documents/Research/decoy_payroll.xlsx',
          process: 'RANSOMWARE_SIM_001 (PID 4821)',
          threatScore: '74% (Critical)',
          latency: '1.85s',
          actionTaken: 'Process Isolated & Sandbox Armed'
        });
      });
    });

    // Settings Modal Triggers
    document.querySelectorAll('.btn-open-phone-settings').forEach(btn => {
      btn.addEventListener('click', openSettings);
    });

    document.getElementById('btn-webhook-close')?.addEventListener('click', closeSettings);

    document.getElementById('webhook-service-select')?.addEventListener('change', updateSettingsVisibility);

    // Save Settings
    document.getElementById('btn-webhook-save')?.addEventListener('click', () => {
      const svcSelect = document.getElementById('webhook-service-select');
      const tgToken = document.getElementById('webhook-tg-token');
      const tgChat = document.getElementById('webhook-tg-chat');
      const genUrl = document.getElementById('webhook-gen-url');

      saveSettings({
        service: svcSelect ? svcSelect.value : 'simulation',
        telegramToken: tgToken ? tgToken.value.trim() : '',
        telegramChatId: tgChat ? tgChat.value.trim() : '',
        webhookUrl: genUrl ? genUrl.value.trim() : ''
      });

      closeSettings();
      if (window.UI && UI.showToast) {
        UI.showToast('📱 SETTINGS SAVED', 'Mobile push escalation settings updated successfully.', 'success');
      }
    });

    // Test Alert inside Settings
    document.getElementById('btn-webhook-test')?.addEventListener('click', () => {
      triggerAlert({
        title: '📱 Mobile Alert Integration Test',
        targetPath: '/Documents/Research/test_tripwire.docx',
        process: 'TEST_DIAGNOSTIC_PROCESS',
        threatScore: '65%',
        latency: '0.9s',
        actionTaken: 'Connection Verified'
      });
    });
  }

  return {
    init,
    triggerAlert,
    dismissPhone,
    toggleMinimize,
    openSettings,
    closeSettings,
    getConfig: () => ({ ...config })
  };

})();

window.MobileAlertEngine = MobileAlertEngine;
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => MobileAlertEngine.init());
} else {
  MobileAlertEngine.init();
}

