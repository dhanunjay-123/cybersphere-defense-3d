/* =========================================================
   decoy.js
   Adaptive Decoy Engine: evaluates virtual directories,
   computes live risk ranking, and adaptively recommends &
   deploys deception decoys ("honeypots") to the highest-risk folder.
   ========================================================= */

const DecoyEngine = (() => {

  const DECOY_NAMES = [
    'research_backup.docx',
    'financial_report.xlsx',
    'project_data.pdf',
    'confidential_notes.docx',
    'archive_2026.xlsx'
  ];

  let deployedDecoys = [];      // list of node ids
  let recommendedFolderId = null;
  let lastRecommendationData = null;
  let watchTimer = null;

  // Intrinsic value weight per directory representing data criticality
  const FILE_IMPORTANCE = {
    Research: 0.95,
    Projects: 0.80,
    Reports:  0.70,
    Downloads: 0.30,
    Pictures: 0.15,
    Desktop:  0.35
  };

  function getWatchableFolders() {
    const root = window.FileSystem ? FileSystem.get(App.state.rootId) : null;
    if (!root) return [];
    const documents = root.children.map(id => FileSystem.get(id)).find(n => n && n.name === 'Documents');
    const folders = documents ? [...documents.children.map(id => FileSystem.get(id)).filter(Boolean)] : [];
    root.children.map(id => FileSystem.get(id)).forEach(f => {
      if (f && f.name !== 'Documents' && (f.type === 'folder')) folders.push(f);
    });
    return folders;
  }

  function folderActivityScore(folderId) {
    const folder = FileSystem.get(folderId);
    if (!folder) return 0;
    let score = folder.activity;
    folder.children.forEach(id => {
      const child = FileSystem.get(id);
      if (child) score += child.activity * 0.35;
    });
    return score;
  }

  function computeRiskRanking() {
    const indicators = window.RuleEngine ? RuleEngine.getIndicators() : {};
    const folders = getWatchableFolders();

    const ranked = folders.map(f => {
      const activity = folderActivityScore(f.id);
      const modFactor = (indicators.modificationFrequency || 0) * 0.35;
      const deviationFactor = (indicators.behaviorDeviation || 0) * 0.25;
      const importance = (FILE_IMPORTANCE[f.name] ?? 0.4) * 45;

      const score = Math.round(Math.min(100,
        activity * 0.95 + modFactor + deviationFactor + importance * 0.5
      ));

      return {
        id: f.id,
        name: f.name,
        path: FileSystem.getPath(f.id),
        score,
        fileCount: f.children.length,
        importance: Math.round((FILE_IMPORTANCE[f.name] ?? 0.4) * 100)
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }

  function watch() {
    stopWatch();
    watchTimer = setInterval(() => {
      const ranking = computeRiskRanking();
      UI.updateDecoyRiskRanking(ranking);

      const best = ranking[0];
      if (best && best.score > 22 && recommendedFolderId !== best.id && !hasDecoyIn(best.id)) {
        recommendedFolderId = best.id;
        const reasons = [
          '✓ High user activity and visit frequency',
          '✓ Critical data classification (Research/Work-product)',
          '✓ Frequent file accesses in directory',
          '✓ Strategic tripwire placement for traversal interception'
        ];
        lastRecommendationData = {
          targetId: best.id,
          path: best.path,
          name: best.name,
          score: best.score,
          activity: best.score > 60 ? 'HIGH' : 'MEDIUM',
          reasons
        };

        UI.showDecoyRecommendation(lastRecommendationData);
        UI.logEvent(`AI Recommendation: High-risk directory detected — ${best.path} (${best.score}%)`, 'warn');

        if (window.EventBus) {
          EventBus.emit(EventBus.Events.DECOY_RECOMMENDED, lastRecommendationData);
        }
      }

      if (window.FileSystem) FileSystem.decayActivity();
    }, 3500);
  }

  function hasDecoyIn(folderId) {
    const folder = FileSystem.get(folderId);
    if (!folder) return false;
    return folder.children.some(id => {
      const child = FileSystem.get(id);
      return child && child.isDecoy;
    });
  }

  function deployTo(folderId) {
    const folder = FileSystem.get(folderId);
    if (!folder) return null;
    if (hasDecoyIn(folderId)) {
      UI.logEvent(`Decoy already active in ${folder.name}`, 'info');
      return null;
    }

    const usedNames = deployedDecoys.map(id => FileSystem.get(id)?.name).filter(Boolean);
    const name = DECOY_NAMES.find(n => !usedNames.includes(n)) || `decoy_backup_${deployedDecoys.length + 1}.docx`;
    const decoy = FileSystem.addDecoy(folderId, name);
    deployedDecoys.push(decoy.id);

    SceneManager.addNodeMeshFor(decoy.id);
    setTimeout(() => {
      SceneManager.spawnDecoy(decoy.id);
    }, 60);

    UI.logEvent(`🛡️ Adaptive decoy deployed: ${FileSystem.getPath(decoy.id)}`, 'success');
    UI.hideDecoyRecommendation();
    recommendedFolderId = null;

    if (window.EventBus) {
      EventBus.emit(EventBus.Events.DECOY_DEPLOYED, {
        decoyId: decoy.id,
        name: decoy.name,
        folderName: folder.name,
        path: FileSystem.getPath(decoy.id)
      });
    }

    return decoy;
  }

  function deployToRecommended() {
    if (recommendedFolderId) return deployTo(recommendedFolderId);
    return null;
  }

  function deployToResearchDefault() {
    const documents = FileSystem.get(App.state.rootId)?.children
      .map(id => FileSystem.get(id)).find(n => n && n.name === 'Documents');
    if (!documents) return null;
    const research = documents.children.map(id => FileSystem.get(id)).find(n => n && n.name === 'Research');
    if (!research) return null;
    return deployTo(research.id);
  }

  function getDeployed() { return deployedDecoys; }

  function isDecoyNode(id) {
    const n = FileSystem.get(id);
    return n && n.isDecoy;
  }

  function getRecommendationData() {
    return lastRecommendationData;
  }

  function stopWatch() {
    if (watchTimer) {
      clearInterval(watchTimer);
      watchTimer = null;
    }
  }

  function reset() {
    stopWatch();
    deployedDecoys = [];
    recommendedFolderId = null;
    lastRecommendationData = null;
    UI.hideDecoyRecommendation();
    UI.updateDecoyRiskRanking([]);
  }

  return {
    watch,
    deployTo,
    deployToRecommended,
    deployToResearchDefault,
    getDeployed,
    isDecoyNode,
    computeRiskRanking,
    getRecommendationData,
    stopWatch,
    reset
  };
})();

window.DecoyEngine = DecoyEngine;
