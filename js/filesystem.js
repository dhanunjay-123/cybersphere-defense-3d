/* =========================================================
   filesystem.js
   Defines the simulated virtual file-system used throughout
   the app. Nothing here touches the real disk — every node
   is a plain JS object rendered as a 3D object in scene.js.
   ========================================================= */

const FileSystem = (() => {

  // Each node: { id, name, type: 'root'|'folder'|'file'|'decoy',
  //              parentId, children: [], ext, activity, isDecoy }
  let nodes = {};
  let nextId = 1;

  function makeId(prefix) {
    return `${prefix}-${nextId++}`;
  }

  function addNode({ name, type, parentId, ext = null, isDecoy = false }) {
    const id = makeId(type);
    const node = {
      id, name, type, parentId,
      children: [],
      ext,
      isDecoy,
      activity: 0,          // rolling activity score 0-100, decays over time
      accessCount: 0,
      lastAccess: null,
      position: null,       // filled in by scene.js
      object3d: null        // filled in by scene.js
    };
    nodes[id] = node;
    if (parentId && nodes[parentId]) {
      nodes[parentId].children.push(id);
    }
    return node;
  }

  function build() {
    nodes = {};
    nextId = 1;

    const root = addNode({ name: 'Computer', type: 'root', parentId: null });

    const documents = addNode({ name: 'Documents', type: 'folder', parentId: root.id });
    const pictures  = addNode({ name: 'Pictures', type: 'folder', parentId: root.id });
    const downloads = addNode({ name: 'Downloads', type: 'folder', parentId: root.id });
    const desktop   = addNode({ name: 'Desktop', type: 'folder', parentId: root.id });

    const projects  = addNode({ name: 'Projects', type: 'folder', parentId: documents.id });
    const research  = addNode({ name: 'Research', type: 'folder', parentId: documents.id });
    const reports   = addNode({ name: 'Reports', type: 'folder', parentId: documents.id });

    // Files inside Projects
    addNode({ name: 'roadmap.docx', type: 'file', parentId: projects.id, ext: 'docx' });
    addNode({ name: 'budget.xlsx', type: 'file', parentId: projects.id, ext: 'xlsx' });
    addNode({ name: 'notes.txt', type: 'file', parentId: projects.id, ext: 'txt' });

    // Files inside Research (the "high value" directory)
    addNode({ name: 'literature_review.docx', type: 'file', parentId: research.id, ext: 'docx' });
    addNode({ name: 'dataset_summary.xlsx', type: 'file', parentId: research.id, ext: 'xlsx' });
    addNode({ name: 'analysis.pdf', type: 'file', parentId: research.id, ext: 'pdf' });
    addNode({ name: 'draft_paper.docx', type: 'file', parentId: research.id, ext: 'docx' });

    // Files inside Reports
    addNode({ name: 'quarterly_report.pdf', type: 'file', parentId: reports.id, ext: 'pdf' });
    addNode({ name: 'summary.docx', type: 'file', parentId: reports.id, ext: 'docx' });

    // Pictures
    addNode({ name: 'photo_2024.jpg', type: 'file', parentId: pictures.id, ext: 'jpg' });
    addNode({ name: 'screenshot.png', type: 'file', parentId: pictures.id, ext: 'png' });

    // Downloads
    addNode({ name: 'installer.exe', type: 'file', parentId: downloads.id, ext: 'exe' });
    addNode({ name: 'archive.zip', type: 'file', parentId: downloads.id, ext: 'zip' });

    // Desktop
    addNode({ name: 'todo.txt', type: 'file', parentId: desktop.id, ext: 'txt' });

    return { rootId: root.id };
  }

  function get(id) { return nodes[id]; }
  function all() { return nodes; }

  function getPath(id) {
    const parts = [];
    let cur = nodes[id];
    while (cur) {
      if (cur.type !== 'root') parts.unshift(cur.name);
      cur = cur.parentId ? nodes[cur.parentId] : null;
    }
    return '/' + parts.join('/');
  }

  function getFolders() {
    return Object.values(nodes).filter(n => n.type === 'folder' || n.type === 'root');
  }

  function getFiles(parentId = null) {
    if (parentId) {
      return nodes[parentId].children.map(id => nodes[id]).filter(n => n.type === 'file' || n.type === 'decoy');
    }
    return Object.values(nodes).filter(n => n.type === 'file' || n.type === 'decoy');
  }

  function getAllLeafFiles() {
    return Object.values(nodes).filter(n => n.type === 'file' || n.type === 'decoy');
  }

  function addDecoy(parentId, name) {
    return addNode({ name, type: 'decoy', parentId, ext: name.split('.').pop(), isDecoy: true });
  }

  function touch(id) {
    const n = nodes[id];
    if (!n) return;
    n.accessCount++;
    n.lastAccess = Date.now();
    n.activity = Math.min(100, n.activity + 25);
  }

  function decayActivity() {
    Object.values(nodes).forEach(n => {
      n.activity = Math.max(0, n.activity - 4);
    });
  }

  function reset() {
    return build();
  }

  return {
    build, get, all, getPath, getFolders, getFiles, getAllLeafFiles,
    addDecoy, touch, decayActivity, reset
  };
})();

window.FileSystem = FileSystem;
