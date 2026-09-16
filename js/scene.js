/* =========================================================
   scene.js
   CYBERSPHERE DEFENSE 3D — Advanced Virtual Cybersecurity Engine
   Full-fidelity 3D environment with continuous data conduits,
   ambient cyber dust starfield, ground radar sweep beam,
   active ransomware file corruption & digital glitch FX,
   blinding decoy EMP blasts, interactive targeting reticles,
   and cinematic auto-orbit camera choreography.
   ========================================================= */

const SceneManager = (() => {

  let renderer, scene, camera, controls;
  let clock;
  let raycaster, mouse;
  let container;

  // Meshes & Graph State
  let nodeMeshes = {};        // nodeId -> THREE.Group
  let edgeLines = [];
  let traversalTrails = [];   // Red trails left by ransomware
  let particles = [];         // Active moving telemetry particles
  let shockwaves = [];
  let pulsingNodes = {};      // nodeId -> { intensity, kind }
  let corruptedNodes = {};    // nodeId -> { originalColor, originalEmissive, wireMesh, originalText }
  let conduitPackets = [];    // Continuous ambient data packets along edges

  // Ambient & Atmospheric Systems
  let starfieldPoints = null;
  let radarBeamMesh = null;
  let radarWaveMesh = null;
  let targetReticle = null;   // 3D holographic hover/selection reticle
  let activeLaserBeam = null; // Laser from drone to victim node

  // Next-Gen Visual & Animation Systems
  let sectorPlatforms = {};   // folderId -> { group, disc, ring, labelSprite, isAlert }
  let digitalDebris = [];     // Exploding 3D digital pixel fragments
  let protectionBubbles = []; // Glistening cyan forcefield bubbles around uncorrupted files
  let neuralDownlinkMesh = null; // Laser from AI Core down to decoy
  let telemetryDataPlate = null; // 3D floating hologram data plate on hover/select

  // Special structures
  let aiCoreGroup = null;
  let aiCoreLevel = 'low';
  let platformGroup = null;
  let securityShield = null;
  let processGroup = null;    // Current active process (user or ransomware drone)
  let containmentCage = null; // Geodesic forcefield cage over isolated process
  let alertLight = null;      // Strobe light during attacks

  // Camera & Orbit State
  let autoOrbit = false;
  let orbitAngle = 0;
  let orbitRadius = 54;

  // State
  let processState = {
    type: 'none',             // 'user' | 'ransomware' | 'none'
    currentNodeId: null,
    isIsolated: false,
    stepCount: 0
  };

  let hoveredNodeId = null;
  let selectedNodeId = null;
  let onNodeClickCallback = null;
  let onNodeHoverCallback = null;

  // Palette
  const COLORS = {
    blue:       0x00e5ff, // Vibrant Cyan / AI / Infrastructure
    deepBlue:   0x1565c0,
    green:      0x00e676, // Clean user files
    yellow:     0xffd600, // Anomaly detected
    orange:     0xff9100, // Suspicious
    red:        0xff1744, // Ransomware threat / Corrupted
    purple:     0xd500f9, // Adaptive decoy (Neon Magenta / Purple)
    cyan:       0x00f0ff, // Data / Telemetry flow
    white:      0xe0f2fe, // Virtual documents
    gold:       0xffc107,
    gridDark:   0x081326,
    gridLight:  0x142848
  };

  function init(el) {
    container = el;
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050914, 0.011);

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    const aspect = width / height;

    camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 1000);
    camera.position.set(0, 32, 54);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    if (typeof THREE.OrbitControls === 'function') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 18;
      controls.maxDistance = 125;
      controls.maxPolarAngle = Math.PI * 0.485;
      controls.target.set(0, 4.5, 0);
    }

    setupLighting();
    buildCyberPlatform();
    buildSecurityShield();
    buildAmbientStarfield();
    buildTargetReticle();
    buildTelemetryDataPlate();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    animate();
  }

  function setupLighting() {
    scene.add(new THREE.AmbientLight(0x0e1c2e, 1.8));

    const keyLight = new THREE.DirectionalLight(0x70b5ff, 0.9);
    keyLight.position.set(30, 45, 25);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.4);
    rimLight.position.set(-30, 20, -25);
    scene.add(rimLight);

    const corePoint = new THREE.PointLight(COLORS.blue, 2.0, 110);
    corePoint.position.set(0, 19, 0);
    scene.add(corePoint);

    const groundRim = new THREE.PointLight(0x0a335c, 1.4, 85);
    groundRim.position.set(0, 0.8, 0);
    scene.add(groundRim);

    alertLight = new THREE.PointLight(COLORS.red, 0.0, 120);
    alertLight.position.set(0, 16, 0);
    scene.add(alertLight);
  }

  function onResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  /* ---------------- Atmospheric Systems: Starfield, Radar & Reticle ---------------- */

  function buildAmbientStarfield() {
    if (starfieldPoints) scene.remove(starfieldPoints);

    const count = 320;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 65;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.random() * 38;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      const isPurple = Math.random() > 0.65;
      colors[i * 3] = isPurple ? 0.83 : 0.0;
      colors[i * 3 + 1] = isPurple ? 0.15 : 0.9;
      colors[i * 3 + 2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    starfieldPoints = new THREE.Points(geo, mat);
    scene.add(starfieldPoints);
  }

  function buildTargetReticle() {
    if (targetReticle) scene.remove(targetReticle);
    targetReticle = new THREE.Group();

    // Outer rotating tick ring
    const ringGeo = new THREE.RingGeometry(1.6, 1.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    targetReticle.add(ring);

    // 4 Corner brackets
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const bracketGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(1.8, 0.4, 0),
        new THREE.Vector3(1.8, 1.8, 0),
        new THREE.Vector3(0.4, 1.8, 0)
      ]);
      const bracketMat = new THREE.LineBasicMaterial({ color: COLORS.blue, linewidth: 2 });
      const bracket = new THREE.Line(bracketGeo, bracketMat);
      bracket.rotation.z = angle;
      targetReticle.add(bracket);
    }

    targetReticle.visible = false;
    scene.add(targetReticle);
  }

  function updateTargetReticle(targetGroup) {
    if (!targetReticle) return;
    if (!targetGroup) {
      targetReticle.visible = false;
      return;
    }
    targetReticle.visible = true;
    targetReticle.position.copy(targetGroup.position);
    targetReticle.lookAt(camera.position);
  }

  /* ---------------- 3D Floating Holographic Telemetry Data Plate ---------------- */

  function buildTelemetryDataPlate() {
    if (telemetryDataPlate) scene.remove(telemetryDataPlate);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    telemetryDataPlate = new THREE.Sprite(mat);
    telemetryDataPlate.scale.set(6.2, 3.1, 1);
    telemetryDataPlate.visible = false;
    telemetryDataPlate.userData = { canvas, texture };
    scene.add(telemetryDataPlate);
  }

  function updateTelemetryDataPlate(nodeId) {
    if (!telemetryDataPlate) return;
    if (!nodeId || !nodeMeshes[nodeId]) {
      telemetryDataPlate.visible = false;
      return;
    }
    const g = nodeMeshes[nodeId];
    const fsNode = window.FileSystem ? FileSystem.get(nodeId) : null;
    const name = fsNode ? fsNode.name : 'Unknown';
    const isCorrupted = g.userData.isCorrupted;
    const isDecoy = g.userData.isDecoy;
    const isFolder = fsNode && (fsNode.type === 'folder' || fsNode.type === 'root');

    const canvas = telemetryDataPlate.userData.canvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cyber chamfered panel background
    ctx.fillStyle = isCorrupted ? 'rgba(42, 6, 12, 0.94)' : isDecoy ? 'rgba(44, 8, 58, 0.92)' : 'rgba(5, 18, 36, 0.92)';
    ctx.strokeStyle = isCorrupted ? '#ff1744' : isDecoy ? '#e040fb' : '#00e5ff';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(canvas.width - 28, 0);
    ctx.lineTo(canvas.width, 28);
    ctx.lineTo(canvas.width, canvas.height - 28);
    ctx.lineTo(canvas.width - 28, canvas.height);
    ctx.lineTo(28, canvas.height);
    ctx.lineTo(0, canvas.height - 28);
    ctx.lineTo(0, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = isCorrupted ? '#ff5252' : isDecoy ? '#ea80fc' : '#00e5ff';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.fillText(isCorrupted ? '⚠ THREAT COMPROMISED' : isDecoy ? '🛡️ ADAPTIVE DECOY TRIPWIRE' : '🔷 TELEMETRY NODE', 24, 40);

    // Subtle divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 54);
    ctx.lineTo(canvas.width - 20, 54);
    ctx.stroke();

    // Telemetry Key-Value Rows
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`NODE: ${name.substring(0, 20)}`, 24, 90);

    const entropyVal = isCorrupted ? '7.94 (ENCRYPTED / ANOMALOUS)' : isDecoy ? '5.18 (TRIPWIRE PLANTED)' : isFolder ? 'N/A (DIRECTORY PATH)' : '4.15 (NORMAL BASELINE)';
    ctx.fillStyle = isCorrupted ? '#ff5252' : '#81d4fa';
    ctx.fillText(`ENTROPY: ${entropyVal}`, 24, 130);

    const riskVal = isCorrupted ? 'CRITICAL (100%)' : isDecoy ? 'ACTIVE MONITOR' : 'LOW (0.04)';
    ctx.fillStyle = isCorrupted ? '#ff1744' : isDecoy ? '#ea80fc' : '#69f0ae';
    ctx.fillText(`RISK INDEX: ${riskVal}`, 24, 170);

    const statusVal = isCorrupted ? 'LOCKED (AES-256 SIM)' : isDecoy ? 'ACTIVE HONEYPOT' : 'VERIFIED INTACT';
    ctx.fillStyle = isCorrupted ? '#ff5252' : '#ffffff';
    ctx.fillText(`STATUS: ${statusVal}`, 24, 210);

    telemetryDataPlate.userData.texture.needsUpdate = true;
    telemetryDataPlate.scale.set(7.5, 3.8, 1);
    telemetryDataPlate.position.copy(g.position).add(new THREE.Vector3(0, 4.2, 0));
    telemetryDataPlate.visible = true;
  }

  /* ---------------- Holographic Sector Platforms & Heatmap ---------------- */

  function buildSectorPlatforms() {
    Object.values(sectorPlatforms).forEach(s => scene.remove(s.group));
    sectorPlatforms = {};

    const fs = window.FileSystem;
    if (!fs) return;

    const allFolders = Object.keys(nodeMeshes)
      .map(id => fs.get(id))
      .filter(n => n && (n.type === 'folder' || n.type === 'root'));

    allFolders.forEach(folder => {
      const g = nodeMeshes[folder.id];
      if (!g) return;

      const sectorGroup = new THREE.Group();
      const radius = folder.type === 'root' ? 8.2 : 6.8;

      // Semi-transparent sector disc on floor
      const discGeo = new THREE.CircleGeometry(radius, 48);
      const discMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(g.position.x, 0.02, g.position.z);
      sectorGroup.add(disc);

      // Boundary Ring
      const ringGeo = new THREE.RingGeometry(radius - 0.22, radius, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(g.position.x, 0.03, g.position.z);
      sectorGroup.add(ring);

      // Sector Floor Label
      const labelSprite = createSectorLabel(`SECTOR: ${folder.name.toUpperCase()}`);
      labelSprite.position.set(g.position.x, 0.06, g.position.z + radius - 0.6);
      sectorGroup.add(labelSprite);

      scene.add(sectorGroup);
      sectorPlatforms[folder.id] = {
        group: sectorGroup,
        disc,
        ring,
        labelSprite,
        isAlert: false
      };
    });
  }

  function createSectorLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#80d8ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(5.5, 1.4, 1);
    return sprite;
  }

  function updateSectorAlert(nodeId, isThreat = true) {
    if (!window.FileSystem) return;
    const node = FileSystem.get(nodeId);
    if (!node) return;

    const targetFolderId = (node.type === 'folder' || node.type === 'root') ? node.id : node.parentId;
    const platform = sectorPlatforms[targetFolderId];
    if (platform && !platform.isAlert && isThreat) {
      platform.isAlert = true;
      if (window.AudioEngine) AudioEngine.playSectorAlarmSound();
      if (window.gsap) {
        gsap.to(platform.ring.material.color, { r: 1, g: 0.09, b: 0.26, duration: 0.35 });
        gsap.to(platform.disc.material.color, { r: 1, g: 0.09, b: 0.26, duration: 0.35 });
        gsap.to(platform.disc.material, { opacity: 0.18, duration: 0.35 });
        gsap.to(platform.ring.material, { opacity: 0.85, duration: 0.35 });
      } else {
        platform.ring.material.color.setHex(0xff1744);
        platform.disc.material.color.setHex(0xff1744);
        platform.disc.material.opacity = 0.18;
        platform.ring.material.opacity = 0.85;
      }
    }
  }

  function resetSectorAlerts() {
    Object.values(sectorPlatforms).forEach(p => {
      p.isAlert = false;
      if (window.gsap) {
        gsap.to(p.ring.material.color, { r: 0, g: 0.9, b: 1, duration: 0.6 });
        gsap.to(p.disc.material.color, { r: 0, g: 0.9, b: 1, duration: 0.6 });
        gsap.to(p.disc.material, { opacity: 0.05, duration: 0.6 });
        gsap.to(p.ring.material, { opacity: 0.35, duration: 0.6 });
      } else {
        p.ring.material.color.setHex(0x00e5ff);
        p.disc.material.color.setHex(0x00e5ff);
        p.disc.material.opacity = 0.05;
        p.ring.material.opacity = 0.35;
      }
    });
  }

  /* ---------------- Digital Debris & Shockwave FX ---------------- */

  function spawnDigitalDebris(originPos) {
    const count = 18;
    const boxGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    for (let i = 0; i < count; i++) {
      const col = Math.random() > 0.4 ? 0xff1744 : 0xff5252;
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1.0 });
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.copy(originPos);

      const speed = 2.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const vel = new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * speed,
        Math.abs(Math.sin(phi)) * speed + 1.2,
        Math.sin(theta) * Math.cos(phi) * speed
      );
      scene.add(mesh);
      digitalDebris.push({
        mesh,
        vel,
        rotSpeed: (Math.random() - 0.5) * 10,
        age: 0,
        maxAge: 0.65 + Math.random() * 0.35
      });
    }

    // Hexagonal glitch shockwave
    const hexGeo = new THREE.RingGeometry(0.2, 0.6, 6);
    const hexMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    const hexMesh = new THREE.Mesh(hexGeo, hexMat);
    hexMesh.rotation.x = -Math.PI / 2;
    hexMesh.position.copy(originPos);
    hexMesh.position.y = 0.1;
    scene.add(hexMesh);
    shockwaves.push({ mesh: hexMesh, t: 0, maxScale: 15 });
  }

  /* ---------------- AI Neural Downlink Decoy Materialization ---------------- */

  function spawnNeuralDownlink(targetPos) {
    if (neuralDownlinkMesh) scene.remove(neuralDownlinkMesh);

    const startPos = aiCoreGroup ? aiCoreGroup.position.clone() : new THREE.Vector3(0, 19, 0);
    const distance = startPos.distanceTo(targetPos);

    const beamGeo = new THREE.CylinderGeometry(0.18, 0.45, distance, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    neuralDownlinkMesh = new THREE.Mesh(beamGeo, beamMat);

    const midPoint = new THREE.Vector3().addVectors(startPos, targetPos).multiplyScalar(0.5);
    neuralDownlinkMesh.position.copy(midPoint);
    neuralDownlinkMesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(targetPos, startPos).normalize()
    );
    scene.add(neuralDownlinkMesh);

    if (window.AudioEngine) AudioEngine.playDecoyDeploySound();

    if (window.gsap) {
      gsap.to(neuralDownlinkMesh.material, {
        opacity: 0,
        duration: 0.95,
        ease: 'power2.out',
        onComplete: () => {
          if (neuralDownlinkMesh) {
            scene.remove(neuralDownlinkMesh);
            neuralDownlinkMesh = null;
          }
        }
      });
    } else {
      setTimeout(() => {
        if (neuralDownlinkMesh) {
          scene.remove(neuralDownlinkMesh);
          neuralDownlinkMesh = null;
        }
      }, 950);
    }
  }

  /* ---------------- Protective Forcefield Bubble Wave ---------------- */

  function triggerProtectionBubbleWave(originPos) {
    if (window.AudioEngine) AudioEngine.playShieldBubbleSound();

    Object.keys(nodeMeshes).forEach(id => {
      const g = nodeMeshes[id];
      if (!g || g.userData.isCorrupted || g.userData.isDecoy) return;

      const bubbleGeo = new THREE.SphereGeometry(1.5, 16, 16);
      const bubbleMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
      g.add(bubbleMesh);

      protectionBubbles.push({
        parent: g,
        mesh: bubbleMesh,
        age: 0,
        maxAge: 2.8
      });

      if (window.gsap) {
        gsap.from(bubbleMesh.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 0.5, ease: 'back.out(2)' });
      }
    });
  }

  /* ---------------- Cyber Platform & Security Shield ---------------- */

  function buildCyberPlatform() {
    if (platformGroup) scene.remove(platformGroup);
    platformGroup = new THREE.Group();

    // Dual layered high-tech ground grid
    const grid = new THREE.GridHelper(145, 58, COLORS.blue, COLORS.gridDark);
    grid.position.y = -0.05;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    platformGroup.add(grid);

    // Platform Concentric Rings
    const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.blue, transparent: true, opacity: 0.28 });
    [18, 26, 36, 48].forEach(r => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.28, 80), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      platformGroup.add(ring);
    });

    // Radar Pulse Wave (expanding ring)
    const radarGeo = new THREE.RingGeometry(0.5, 1.8, 64);
    const radarMat = new THREE.MeshBasicMaterial({ color: COLORS.blue, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    radarWaveMesh = new THREE.Mesh(radarGeo, radarMat);
    radarWaveMesh.rotation.x = -Math.PI / 2;
    radarWaveMesh.position.y = 0.04;
    platformGroup.add(radarWaveMesh);

    // Rotating Radar Scanner Beam
    const beamGeo = new THREE.CircleGeometry(55, 32, 0, Math.PI / 5);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    radarBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    radarBeamMesh.rotation.x = -Math.PI / 2;
    radarBeamMesh.position.y = 0.03;
    platformGroup.add(radarBeamMesh);

    // Root Computer Cyber Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(4.8, 5.8, 1.4, 6);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x081322,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x041b33,
      emissiveIntensity: 0.75
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 0.7, 0);
    platformGroup.add(pedestal);

    const pedestalRing = new THREE.Mesh(
      new THREE.TorusGeometry(5.4, 0.09, 16, 64),
      new THREE.MeshBasicMaterial({ color: COLORS.blue, transparent: true, opacity: 0.85 })
    );
    pedestalRing.rotation.x = Math.PI / 2;
    pedestalRing.position.y = 1.35;
    platformGroup.add(pedestalRing);

    scene.add(platformGroup);
  }

  function buildSecurityShield() {
    if (securityShield) scene.remove(securityShield);

    const shieldGeo = new THREE.SphereGeometry(40, 42, 28, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: COLORS.green,
      wireframe: true,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide
    });
    securityShield = new THREE.Mesh(shieldGeo, shieldMat);
    securityShield.userData = { state: 'normal', baseColor: COLORS.green };
    scene.add(securityShield);
  }

  function updateSecurityShield(state) {
    if (!securityShield) return;
    securityShield.userData.state = state;

    let targetColor, targetOpacity;
    if (state === 'contained') {
      targetColor = COLORS.blue;
      targetOpacity = 0.35;
    } else if (state === 'critical' || state === 'threat') {
      targetColor = COLORS.red;
      targetOpacity = 0.44;
    } else if (state === 'suspicious') {
      targetColor = COLORS.orange;
      targetOpacity = 0.28;
    } else if (state === 'decoy') {
      targetColor = COLORS.purple;
      targetOpacity = 0.48;
    } else {
      targetColor = COLORS.green;
      targetOpacity = 0.09;
    }

    if (window.gsap) {
      gsap.to(securityShield.material.color, {
        r: ((targetColor >> 16) & 255) / 255,
        g: ((targetColor >> 8) & 255) / 255,
        b: (targetColor & 255) / 255,
        duration: 0.7
      });
      gsap.to(securityShield.material, { opacity: targetOpacity, duration: 0.7 });
    } else {
      securityShield.material.color.setHex(targetColor);
      securityShield.material.opacity = targetOpacity;
    }
  }

  /* ---------------- 3D Filesystem Graph ---------------- */

  function buildFileSystem(rootId) {
    Object.values(nodeMeshes).forEach(g => scene.remove(g));
    edgeLines.forEach(l => scene.remove(l));
    traversalTrails.forEach(l => scene.remove(l));
    conduitPackets.forEach(p => scene.remove(p.mesh));
    nodeMeshes = {};
    edgeLines = [];
    traversalTrails = [];
    conduitPackets = [];
    corruptedNodes = {};
    Object.values(sectorPlatforms).forEach(s => scene.remove(s.group));
    sectorPlatforms = {};

    const fs = window.FileSystem;
    if (!fs) return;
    const root = fs.get(rootId);
    if (!root) return;

    placeNode(root, new THREE.Vector3(0, 4.5, 0));
    createNodeMesh(root);

    const topFolders = root.children.map(id => fs.get(id)).filter(Boolean);
    const topRadius = 18;

    topFolders.forEach((folder, i) => {
      const angle = (i / topFolders.length) * Math.PI * 2;
      const pos = new THREE.Vector3(
        Math.cos(angle) * topRadius,
        3.4,
        Math.sin(angle) * topRadius
      );
      placeNode(folder, pos);
      createNodeMesh(folder);
      createEdge(root, folder);

      const subItems = folder.children.map(id => fs.get(id)).filter(Boolean);
      const subRadius = 7.2;

      subItems.forEach((sub, j) => {
        const subAngle = (j / Math.max(subItems.length, 1)) * Math.PI * 2 + angle;
        const subPos = new THREE.Vector3(
          pos.x + Math.cos(subAngle) * subRadius,
          sub.type === 'folder' ? 3.1 : 1.5,
          pos.z + Math.sin(subAngle) * subRadius
        );
        placeNode(sub, subPos);
        createNodeMesh(sub);
        createEdge(folder, sub);

        if (sub.type === 'folder') {
          const leafFiles = sub.children.map(id => fs.get(id)).filter(Boolean);
          const leafRadius = 4.4;
          leafFiles.forEach((file, k) => {
            const leafAngle = (k / Math.max(leafFiles.length, 1)) * Math.PI * 2 + subAngle;
            const leafPos = new THREE.Vector3(
              subPos.x + Math.cos(leafAngle) * leafRadius,
              0.9,
              subPos.z + Math.sin(leafAngle) * leafRadius
            );
            placeNode(file, leafPos);
            createNodeMesh(file);
            createEdge(sub, file);
          });
        }
      });
    });

    buildAICore();
    initContinuousConduitTraffic();
    buildSectorPlatforms();
  }

  function placeNode(node, pos) {
    node.position = pos;
  }

  function createNodeMesh(node) {
    if (!node.position || typeof node.position.x !== 'number') {
      const parentNode = node.parentId && window.FileSystem ? FileSystem.get(node.parentId) : null;
      const parentMesh = node.parentId ? nodeMeshes[node.parentId] : null;
      if (parentMesh && parentMesh.position) {
        const siblings = parentNode && parentNode.children ? parentNode.children.length : 3;
        const angle = (siblings * 1.37) % (Math.PI * 2);
        const radius = 5.0;
        node.position = new THREE.Vector3(
          parentMesh.position.x + Math.cos(angle) * radius,
          1.2,
          parentMesh.position.z + Math.sin(angle) * radius
        );
      } else {
        node.position = new THREE.Vector3(5, 1.2, 5);
      }
    }

    const group = new THREE.Group();
    group.position.copy(node.position);

    let geo, mat, labelText;
    let isDecoy = Boolean(node.type === 'decoy' || node.isDecoy);

    if (node.type === 'root') {
      geo = new THREE.DodecahedronGeometry(2.3, 0);
      mat = new THREE.MeshStandardMaterial({
        color: COLORS.blue,
        emissive: 0x074b7a,
        emissiveIntensity: 0.95,
        metalness: 0.75,
        roughness: 0.2
      });
      labelText = '🖥️ ' + node.name;

      const frameGeo = new THREE.IcosahedronGeometry(2.7, 1);
      const frameMat = new THREE.MeshBasicMaterial({ color: COLORS.blue, wireframe: true, transparent: true, opacity: 0.4 });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.userData.isServerFrame = true;
      group.add(frameMesh);

    } else if (node.type === 'folder') {
      geo = new THREE.BoxGeometry(2.3, 1.9, 2.3);
      mat = new THREE.MeshStandardMaterial({
        color: COLORS.deepBlue,
        emissive: 0x072d54,
        emissiveIntensity: 0.7,
        metalness: 0.5,
        roughness: 0.35
      });
      labelText = '📁 ' + node.name;

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.75 })
      );
      group.add(wire);

      // Rotating base cyber ring
      const baseRing = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 1.8, 24),
        new THREE.MeshBasicMaterial({ color: COLORS.blue, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
      );
      baseRing.rotation.x = -Math.PI / 2;
      baseRing.position.y = -0.9;
      group.add(baseRing);

    } else if (isDecoy) {
      // ADAPTIVE DECOY FILE: Radiant Purple Crystal Diamond with Dual Orbit Rings & Vertical Light Beacon
      geo = new THREE.OctahedronGeometry(1.3, 0);
      mat = new THREE.MeshStandardMaterial({
        color: COLORS.purple,
        emissive: 0x9c27b0,
        emissiveIntensity: 1.4,
        metalness: 0.55,
        roughness: 0.15
      });
      labelText = '🟣 ' + node.name + ' [AI DECOY]';

      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.04, 12, 48),
        new THREE.MeshBasicMaterial({ color: 0xf06292, transparent: true, opacity: 0.9 })
      );
      ring1.userData = { spinX: 1.5, spinY: 0.8 };
      group.add(ring1);

      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(2.0, 0.03, 12, 48),
        new THREE.MeshBasicMaterial({ color: COLORS.purple, transparent: true, opacity: 0.7 })
      );
      ring2.rotation.x = Math.PI / 2;
      ring2.userData = { spinX: -0.9, spinZ: 1.2 };
      group.add(ring2);

      // Vertical Holographic Beacon Light Beam
      const beaconGeo = new THREE.CylinderGeometry(0.25, 1.0, 30, 16, 1, true);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0xd500f9,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.y = 15;
      beaconMesh.userData = { isBeacon: true };
      group.add(beaconMesh);

      const groundDisc = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 2.4, 32),
        new THREE.MeshBasicMaterial({ color: COLORS.purple, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      groundDisc.rotation.x = -Math.PI / 2;
      groundDisc.position.y = -node.position.y + 0.05;
      group.add(groundDisc);

    } else {
      geo = new THREE.BoxGeometry(1.15, 1.5, 0.2);
      let fileColor = COLORS.white;
      let fileEmissive = 0x0a2038;

      if (node.ext === 'docx') { fileColor = 0x82b1ff; fileEmissive = 0x0d47a1; }
      else if (node.ext === 'xlsx') { fileColor = 0xb9f6ca; fileEmissive = 0x1b5e20; }
      else if (node.ext === 'pdf') { fileColor = 0xff8a80; fileEmissive = 0xb71c1c; }
      else if (node.ext === 'exe' || node.ext === 'zip') { fileColor = 0xffd180; fileEmissive = 0xe65100; }

      mat = new THREE.MeshStandardMaterial({
        color: fileColor,
        emissive: fileEmissive,
        emissiveIntensity: 0.55,
        metalness: 0.35,
        roughness: 0.35
      });
      labelText = '📄 ' + node.name;
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.nodeId = node.id;
    group.add(mesh);

    const haloRadius = node.type === 'root' ? 3.6 : node.type === 'folder' ? 2.8 : isDecoy ? 2.1 : 1.6;
    const haloGeo = new THREE.SphereGeometry(haloRadius, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: mat.color,
      transparent: true,
      opacity: isDecoy ? 0.26 : 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    const labelSprite = createBillboardLabel(labelText, node.type, isDecoy);
    labelSprite.position.set(0, (node.type === 'root' ? 3.3 : node.type === 'folder' ? 2.4 : isDecoy ? 2.3 : 1.7), 0);
    group.add(labelSprite);

    group.userData = {
      nodeId: node.id,
      mesh,
      halo,
      labelSprite,
      labelText,
      baseColor: mat.color.clone(),
      baseEmissive: mat.emissive.clone(),
      baseY: node.position.y,
      floatOffset: Math.random() * Math.PI * 2,
      isDecoy,
      isCorrupted: false
    };

    scene.add(group);
    nodeMeshes[node.id] = group;
  }

  function createBillboardLabel(text, type, isDecoy, isCorrupted = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 100;

    const bgCol = isCorrupted ? 'rgba(70, 6, 14, 0.94)' :
                  isDecoy ? 'rgba(74, 10, 110, 0.92)' :
                  (type === 'root' || type === 'folder') ? 'rgba(8, 20, 38, 0.90)' : 'rgba(6, 13, 24, 0.85)';
    const strokeCol = isCorrupted ? '#ff1744' :
                      isDecoy ? '#e040fb' :
                      (type === 'root' || type === 'folder') ? '#00e5ff' : '#4a658a';

    ctx.fillStyle = bgCol;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 3.5;

    const r = 16;
    ctx.beginPath();
    ctx.moveTo(r + 6, 6);
    ctx.lineTo(canvas.width - r - 6, 6);
    ctx.quadraticCurveTo(canvas.width - 6, 6, canvas.width - 6, r + 6);
    ctx.lineTo(canvas.width - 6, canvas.height - r - 6);
    ctx.quadraticCurveTo(canvas.width - 6, canvas.height - 6, canvas.width - r - 6, canvas.height - 6);
    ctx.lineTo(r + 6, canvas.height - 6);
    ctx.quadraticCurveTo(6, canvas.height - 6, 6, canvas.height - r - 6);
    ctx.lineTo(6, r + 6);
    ctx.quadraticCurveTo(6, 6, r + 6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 28px "Space Grotesk", "JetBrains Mono", sans-serif';
    ctx.fillStyle = isCorrupted ? '#ffcdd2' : isDecoy ? '#ffd6ff' : (type === 'root' || type === 'folder') ? '#b3e5fc' : '#e1f5fe';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = strokeCol;
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.6, 0.9, 1);
    return sprite;
  }

  function createEdge(a, b) {
    const points = [a.position, b.position];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x1b467a, transparent: true, opacity: 0.7 });
    const line = new THREE.Line(geo, mat);
    line.userData = { fromId: a.id, toId: b.id, fromPos: a.position.clone(), toPos: b.position.clone() };
    scene.add(line);
    edgeLines.push(line);
  }

  /* ---------------- Continuous Conduit Traffic ---------------- */

  function initContinuousConduitTraffic() {
    conduitPackets.forEach(p => scene.remove(p.mesh));
    conduitPackets = [];

    const packetGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const packetMat = new THREE.MeshBasicMaterial({ color: COLORS.cyan, blending: THREE.AdditiveBlending });

    // Spawn 2 traveling data packets per edge
    edgeLines.forEach(edge => {
      for (let i = 0; i < 2; i++) {
        const mesh = new THREE.Mesh(packetGeo, packetMat);
        scene.add(mesh);
        conduitPackets.push({
          mesh,
          from: edge.userData.fromPos,
          to: edge.userData.toPos,
          t: Math.random(),
          speed: 0.35 + Math.random() * 0.4,
          reverse: Math.random() > 0.5
        });
      }
    });
  }

  /* ---------------- Holographic Cyber AI Core ---------------- */

  function buildAICore() {
    if (aiCoreGroup) scene.remove(aiCoreGroup);
    aiCoreGroup = new THREE.Group();
    aiCoreGroup.position.set(0, 19, 0);

    const nucleusGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: COLORS.blue,
      emissive: 0x0077b6,
      emissiveIntensity: 1.25,
      metalness: 0.6,
      roughness: 0.2
    });
    const core = new THREE.Mesh(nucleusGeo, nucleusMat);
    aiCoreGroup.add(core);

    const shellGeo = new THREE.IcosahedronGeometry(2.1, 1);
    const shellMat = new THREE.MeshBasicMaterial({ color: COLORS.cyan, wireframe: true, transparent: true, opacity: 0.45 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    aiCoreGroup.add(shell);

    const ringConfigs = [
      { r: 3.0, w: 0.04, speed: 0.45, color: COLORS.blue },
      { r: 3.9, w: 0.035, speed: -0.32, color: COLORS.cyan },
      { r: 4.8, w: 0.025, speed: 0.22, color: COLORS.deepBlue }
    ];

    const rings = [];
    ringConfigs.forEach(cfg => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.r, cfg.w, 16, 80),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.65 })
      );
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = { spinSpeed: cfg.speed };
      aiCoreGroup.add(ring);
      rings.push(ring);
    });

    const sparksGroup = new THREE.Group();
    const sparkGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: COLORS.cyan });
    const sparks = [];

    for (let s = 0; s < 28; s++) {
      const sp = new THREE.Mesh(sparkGeo, sparkMat);
      const orbitR = 3.2 + Math.random() * 2.5;
      const angle = (s / 28) * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI;
      sp.position.set(Math.cos(angle) * orbitR, Math.sin(pitch) * orbitR * 0.5, Math.sin(angle) * orbitR);
      sp.userData = { angle, orbitR, pitch, speed: 0.5 + Math.random() * 0.8 };
      sparksGroup.add(sp);
      sparks.push(sp);
    }
    aiCoreGroup.add(sparksGroup);

    const coneGeo = new THREE.ConeGeometry(13, 19, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: COLORS.blue,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const scanCone = new THREE.Mesh(coneGeo, coneMat);
    scanCone.position.set(0, -9.5, 0);
    aiCoreGroup.add(scanCone);

    aiCoreGroup.userData = { core, shell, rings, sparks, scanCone };
    scene.add(aiCoreGroup);
  }

  function setAICoreLevel(level) {
    aiCoreLevel = level;
    if (!aiCoreGroup) return;

    const colorMap = {
      low: COLORS.blue,
      medium: COLORS.yellow,
      high: COLORS.orange,
      critical: COLORS.red
    };
    const c = new THREE.Color(colorMap[level] || COLORS.blue);

    if (alertLight) {
      if (level === 'critical') alertLight.intensity = 1.4;
      else if (level === 'high') alertLight.intensity = 0.7;
      else alertLight.intensity = 0.0;
    }

    if (window.gsap) {
      gsap.to(aiCoreGroup.userData.core.material.color, { r: c.r, g: c.g, b: c.b, duration: 0.5 });
      gsap.to(aiCoreGroup.userData.core.material.emissive, { r: c.r * 0.7, g: c.g * 0.7, b: c.b * 0.7, duration: 0.5 });
      gsap.to(aiCoreGroup.userData.scanCone.material.color, { r: c.r, g: c.g, b: c.b, duration: 0.5 });
      gsap.to(aiCoreGroup.userData.scanCone.material, {
        opacity: level === 'critical' ? 0.22 : level === 'high' ? 0.15 : 0.08,
        duration: 0.5
      });
    } else {
      aiCoreGroup.userData.core.material.color.copy(c);
      aiCoreGroup.userData.core.material.emissive.copy(c).multiplyScalar(0.7);
      aiCoreGroup.userData.scanCone.material.color.copy(c);
    }
  }

  /* ---------------- Process Representations (User vs Ransomware Drone) ---------------- */

  function spawnProcess(startNodeId, type = 'ransomware') {
    if (processGroup) scene.remove(processGroup);
    if (containmentCage) scene.remove(containmentCage);
    if (activeLaserBeam) { scene.remove(activeLaserBeam); activeLaserBeam = null; }
    containmentCage = null;

    processGroup = new THREE.Group();
    processState.type = type;
    processState.currentNodeId = startNodeId;
    processState.isIsolated = false;
    processState.stepCount = 0;

    if (type === 'user') {
      const geo = new THREE.SphereGeometry(0.6, 20, 20);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.green,
        emissive: 0x00c853,
        emissiveIntensity: 1.1,
        metalness: 0.4,
        roughness: 0.2
      });
      const mesh = new THREE.Mesh(geo, mat);
      processGroup.add(mesh);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.025, 12, 40),
        new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.85 })
      );
      ring.rotation.x = Math.PI / 3;
      ring.userData = { spin: 1.2 };
      processGroup.add(ring);

    } else {
      // Malicious Ransomware Threat Drone
      if (window.AudioEngine) AudioEngine.playAttackAlert();

      const geo = new THREE.ConeGeometry(0.7, 1.5, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.red,
        emissive: 0xb71c1c,
        emissiveIntensity: 1.3,
        metalness: 0.7,
        roughness: 0.2
      });
      const cone = new THREE.Mesh(geo, mat);
      cone.rotation.x = Math.PI;
      processGroup.add(cone);

      const threatRing1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.04, 8, 36),
        new THREE.MeshBasicMaterial({ color: COLORS.red, transparent: true, opacity: 0.9 })
      );
      threatRing1.rotation.x = Math.PI / 2;
      threatRing1.userData = { spin: -1.6 };
      processGroup.add(threatRing1);

      const threatRing2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.025, 8, 36),
        new THREE.MeshBasicMaterial({ color: COLORS.orange, transparent: true, opacity: 0.7 })
      );
      threatRing2.rotation.y = Math.PI / 4;
      threatRing2.userData = { spin: 2.1 };
      processGroup.add(threatRing2);

      const spikeGeo = new THREE.OctahedronGeometry(0.35, 0);
      const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff3d00 });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.y = 0.95;
      processGroup.add(spike);

      const laserGeo = new THREE.ConeGeometry(0.5, 2.2, 16, 1, true);
      const laserMat = new THREE.MeshBasicMaterial({
        color: COLORS.red,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const laserCone = new THREE.Mesh(laserGeo, laserMat);
      laserCone.position.set(0, -1.1, 0);
      laserCone.userData = { isLaserCone: true };
      processGroup.add(laserCone);

      // Dynamic Jet Thruster Exhaust Flame
      const thrusterGeo = new THREE.ConeGeometry(0.35, 1.1, 8);
      const thrusterMat = new THREE.MeshBasicMaterial({
        color: 0xff3d00,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const thrusterCone = new THREE.Mesh(thrusterGeo, thrusterMat);
      thrusterCone.position.y = 1.35;
      thrusterCone.userData = { isThruster: true };
      processGroup.add(thrusterCone);

      // Active Threat Scanning Searchlight Cone
      const searchlightGeo = new THREE.ConeGeometry(2.2, 5.5, 16, 1, true);
      const searchlightMat = new THREE.MeshBasicMaterial({
        color: COLORS.red,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const searchlightCone = new THREE.Mesh(searchlightGeo, searchlightMat);
      searchlightCone.position.y = -2.8;
      searchlightCone.userData = { isSearchlight: true };
      processGroup.add(searchlightCone);
    }

    const startNode = nodeMeshes[startNodeId];
    if (startNode) {
      processGroup.position.copy(startNode.position).add(new THREE.Vector3(0, 2.4, 0));
    }
    processGroup.userData = { type, isProcess: true };
    scene.add(processGroup);
    return processGroup;
  }

  function moveProcessTo(nodeId, duration = 0.45, onArrive = null) {
    if (!processGroup || !nodeMeshes[nodeId]) return;
    const targetNode = nodeMeshes[nodeId];
    const targetPos = targetNode.position.clone().add(new THREE.Vector3(0, 2.4, 0));
    const startPos = processGroup.position.clone();
    processState.currentNodeId = nodeId;
    processState.stepCount++;

    if (processState.type === 'ransomware') {
      createTraversalTrail(startPos.clone().sub(new THREE.Vector3(0, 2.4, 0)), targetNode.position);
      drawAttackLaser(processGroup.position, targetNode.position);
    }

    if (window.gsap) {
      gsap.to(processGroup.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration,
        ease: 'power2.inOut',
        onComplete: () => {
          if (activeLaserBeam) {
            scene.remove(activeLaserBeam);
            activeLaserBeam = null;
          }
          if (onArrive) onArrive();
        }
      });
    } else {
      processGroup.position.copy(targetPos);
      if (onArrive) onArrive();
    }
  }

  function drawAttackLaser(fromPos, toPos) {
    if (activeLaserBeam) scene.remove(activeLaserBeam);
    const points = [fromPos, toPos];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.9,
      linewidth: 3
    });
    activeLaserBeam = new THREE.Line(geo, mat);
    scene.add(activeLaserBeam);
  }

  function createTraversalTrail(fromPos, toPos) {
    const geo = new THREE.BufferGeometry().setFromPoints([fromPos, toPos]);
    const mat = new THREE.LineBasicMaterial({
      color: COLORS.red,
      transparent: true,
      opacity: 0.9,
      linewidth: 2.5
    });
    const trail = new THREE.Line(geo, mat);
    scene.add(trail);
    traversalTrails.push(trail);
  }

  /* ---------------- Active File Corruption & Glitch FX ---------------- */

  function corruptNode(nodeId) {
    const g = nodeMeshes[nodeId];
    if (!g || g.userData.isCorrupted || g.userData.isDecoy) return;

    g.userData.isCorrupted = true;
    if (window.AudioEngine) AudioEngine.playLaserZap();

    // 1. Blackened charred crimson material
    const mesh = g.userData.mesh;
    corruptedNodes[nodeId] = {
      origColor: mesh.material.color.clone(),
      origEmissive: mesh.material.emissive.clone()
    };

    mesh.material.color.setHex(0x1a0509);
    mesh.material.emissive.setHex(COLORS.red);
    mesh.material.emissiveIntensity = 1.2;

    // 2. Wrap file in red corrupted wireframe cage
    const wireGeo = new THREE.BoxGeometry(1.3, 1.65, 0.35);
    const wireMat = new THREE.MeshBasicMaterial({ color: COLORS.red, wireframe: true, transparent: true, opacity: 0.85 });
    const wireCage = new THREE.Mesh(wireGeo, wireMat);
    g.add(wireCage);
    corruptedNodes[nodeId].wireCage = wireCage;

    // 3. Jitter glitch vibration
    if (window.gsap) {
      gsap.to(g.scale, {
        x: 1.2, y: 0.85, z: 1.2,
        duration: 0.08,
        yoyo: true,
        repeat: 5,
        ease: 'power1.inOut'
      });
    }

    // 4. Update billboard label to [ENCRYPTED .LOCKED]
    const fsNode = window.FileSystem ? FileSystem.get(nodeId) : null;
    const name = fsNode ? fsNode.name : 'file.locked';
    g.remove(g.userData.labelSprite);
    const lockedSprite = createBillboardLabel(`🔒 ${name}.locked [ENCRYPTED]`, 'file', false, true);
    lockedSprite.position.set(0, 1.7, 0);
    g.add(lockedSprite);
    g.userData.labelSprite = lockedSprite;

    // 5. Digital Matrix Particle Burst & Hexagonal Glitch Shockwave
    spawnDigitalDebris(g.position);
    updateSectorAlert(nodeId, true);
  }

  /* ---------------- Dramatic Decoy EMP Blast Climax ---------------- */

  function triggerDecoyEmp(nodeId) {
    const g = nodeMeshes[nodeId];
    if (!g) return;

    if (window.AudioEngine) AudioEngine.playEmpBlast();

    // 1. Surging skyward beacon
    g.children.forEach(c => {
      if (c.userData && c.userData.isBeacon) {
        c.scale.set(3.0, 1.8, 3.0);
        c.material.opacity = 1.0;
        if (window.gsap) {
          gsap.to(c.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 2.0, ease: 'power2.out' });
          gsap.to(c.material, { opacity: 0.5, duration: 2.0 });
        }
      }
    });

    // 2. Blinding Expanding EMP Dome
    const empGeo = new THREE.SphereGeometry(1.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const empMat = new THREE.MeshBasicMaterial({
      color: 0xe040fb,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const empDome = new THREE.Mesh(empGeo, empMat);
    empDome.position.copy(g.position);
    empDome.position.y = 0.1;
    scene.add(empDome);

    shockwaves.push({ mesh: empDome, t: 0, maxScale: 32 });

    // Also trigger standard shockwave ring
    detectionShockwave(nodeId);
    updateSecurityShield('decoy');
    triggerProtectionBubbleWave(g.position);
  }

  /* ---------------- Isolation & Containment ---------------- */

  function isolateProcess() {
    if (!processGroup) return;
    processState.isIsolated = true;

    if (window.AudioEngine) AudioEngine.playContainmentSuccess();

    traversalTrails.forEach(l => scene.remove(l));
    traversalTrails = [];

    if (activeLaserBeam) { scene.remove(activeLaserBeam); activeLaserBeam = null; }

    processGroup.children.forEach(c => {
      if (c.userData && (c.userData.isLaserCone || c.userData.isSearchlight || c.userData.isThruster)) c.visible = false;
    });

    // Geodesic Cyber Prison Cage
    containmentCage = new THREE.Group();
    containmentCage.position.copy(processGroup.position);

    const cageGeo = new THREE.IcosahedronGeometry(1.85, 1);
    const cageMat = new THREE.MeshBasicMaterial({ color: COLORS.blue, wireframe: true, transparent: true, opacity: 0.85 });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    containmentCage.add(cageMesh);

    const innerBarrierGeo = new THREE.SphereGeometry(1.7, 24, 24);
    const innerBarrierMat = new THREE.MeshStandardMaterial({
      color: 0x00bcd4,
      emissive: 0x006064,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2
    });
    const barrierMesh = new THREE.Mesh(innerBarrierGeo, innerBarrierMat);
    containmentCage.add(barrierMesh);

    // 10 Electric Orbit Sparks
    const zapGroup = new THREE.Group();
    const zapGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const zapMat = new THREE.MeshBasicMaterial({ color: COLORS.cyan });
    for (let z = 0; z < 10; z++) {
      const zm = new THREE.Mesh(zapGeo, zapMat);
      zm.position.set((Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 3.4);
      zm.userData = { angle: Math.random() * Math.PI * 2, r: 1.9, speed: 4.0 + Math.random() * 3.0 };
      zapGroup.add(zm);
    }
    containmentCage.add(zapGroup);
    containmentCage.userData = { cageMesh, barrierMesh, zapGroup };

    scene.add(containmentCage);

    processGroup.children.forEach(c => {
      if (c.material) {
        c.material.opacity = 0.35;
        c.material.transparent = true;
      }
    });

    if (alertLight) alertLight.intensity = 0.0;
    updateSecurityShield('contained');
  }

  function removeProcess() {
    if (processGroup) { scene.remove(processGroup); processGroup = null; }
    if (containmentCage) { scene.remove(containmentCage); containmentCage = null; }
    if (activeLaserBeam) { scene.remove(activeLaserBeam); activeLaserBeam = null; }
    traversalTrails.forEach(l => scene.remove(l));
    traversalTrails = [];
    processState.type = 'none';
    processState.currentNodeId = null;
    processState.isIsolated = false;
    if (alertLight) alertLight.intensity = 0.0;
  }

  /* ---------------- Particle & Telemetry Streams ---------------- */

  function spawnParticle(fromId, toId, kind = 'normal', duration = 0.85, onArrive = null) {
    const from = nodeMeshes[fromId];
    const to = nodeMeshes[toId];
    if (!from || !to) return;

    if (window.AudioEngine && Math.random() > 0.4) AudioEngine.playPacketChirp();

    const color = kind === 'suspicious' ? COLORS.red : kind === 'decoy' ? COLORS.purple : COLORS.cyan;
    const geo = new THREE.SphereGeometry(kind === 'suspicious' ? 0.3 : 0.22, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from.position);
    scene.add(mesh);

    particles.push({
      mesh,
      from: from.position.clone(),
      to: to.position.clone(),
      t: 0,
      speed: 1 / duration,
      color,
      toId,
      onArrive
    });

    pulseNode(fromId, kind);

    if (aiCoreGroup) spawnTelemetryStream(from.position.clone(), kind);
  }

  function spawnTelemetryStream(startPos, kind) {
    if (!aiCoreGroup) return;
    const endPos = aiCoreGroup.position.clone();
    const color = kind === 'suspicious' ? COLORS.red : COLORS.cyan;

    const geo = new THREE.SphereGeometry(0.14, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    scene.add(mesh);

    particles.push({
      mesh,
      from: startPos,
      to: endPos,
      t: 0,
      speed: 1.4,
      color,
      toId: null
    });
  }

  function pulseNode(nodeId, kind = 'normal') {
    const g = nodeMeshes[nodeId];
    if (!g) return;
    pulsingNodes[nodeId] = { intensity: 1.0, kind };
  }

  function spawnDecoy(nodeId) {
    const g = nodeMeshes[nodeId];
    if (!g) return;

    g.scale.set(0.01, 0.01, 0.01);
    if (window.gsap) {
      gsap.to(g.scale, { x: 1, y: 1, z: 1, duration: 1.0, ease: 'back.out(2.4)' });
    } else {
      g.scale.set(1, 1, 1);
    }
    pulseNode(nodeId, 'decoy');
    updateSecurityShield('decoy');
    spawnNeuralDownlink(g.position);
    setTimeout(() => {
      if (securityShield && securityShield.userData.state === 'decoy') updateSecurityShield('normal');
    }, 2500);
  }

  function addNodeMeshFor(nodeId) {
    const node = window.FileSystem ? FileSystem.get(nodeId) : null;
    if (node && !nodeMeshes[nodeId]) {
      if (!node.position || typeof node.position.x !== 'number') {
        const parentNode = node.parentId && window.FileSystem ? FileSystem.get(node.parentId) : null;
        const parentMesh = node.parentId ? nodeMeshes[node.parentId] : null;
        if (parentMesh && parentMesh.position) {
          const siblings = parentNode && parentNode.children ? parentNode.children.length : 3;
          const angle = (siblings * 1.37) % (Math.PI * 2);
          const radius = 5.0;
          node.position = new THREE.Vector3(
            parentMesh.position.x + Math.cos(angle) * radius,
            1.2,
            parentMesh.position.z + Math.sin(angle) * radius
          );
        } else {
          node.position = new THREE.Vector3(5, 1.2, 5);
        }
      }
      createNodeMesh(node);
      if (node.parentId && nodeMeshes[node.parentId]) {
        createEdge(FileSystem.get(node.parentId), node);
      }
    }
  }

  function detectionShockwave(nodeId) {
    const g = nodeMeshes[nodeId];
    if (!g) return;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1.0, 64),
      new THREE.MeshBasicMaterial({
        color: COLORS.purple,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(g.position);
    ring.position.y = 0.1;
    scene.add(ring);
    shockwaves.push({ mesh: ring, t: 0, maxScale: 22 });
  }

  /* ---------------- Camera Transitions & Auto-Orbit ---------------- */

  function focusOn(nodeId, distance = 36) {
    const g = nodeMeshes[nodeId];
    if (!g) return;

    // Minimum safe distance ensures camera never zooms in so close that a cube becomes gigantic
    const safeDistance = Math.max(distance, 32);

    const targetPos = g.position;
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    if (dir.y < 0.35) dir.y = 0.35;
    dir.normalize();

    const newCamPos = targetPos.clone().add(dir.multiplyScalar(safeDistance)).add(new THREE.Vector3(0, 6, 0));

    if (window.gsap) {
      gsap.to(controls.target, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 1.2, ease: 'power2.inOut' });
      gsap.to(camera.position, { x: newCamPos.x, y: newCamPos.y, z: newCamPos.z, duration: 1.2, ease: 'power2.inOut' });
    } else {
      controls.target.copy(targetPos);
      camera.position.copy(newCamPos);
    }
  }

  function focusOnAICore() {
    if (!aiCoreGroup) return;
    if (window.gsap) {
      gsap.to(controls.target, { x: 0, y: 19, z: 0, duration: 1.2, ease: 'power2.inOut' });
      gsap.to(camera.position, { x: 0, y: 26, z: 28, duration: 1.2, ease: 'power2.inOut' });
    } else {
      controls.target.set(0, 19, 0);
      camera.position.set(0, 26, 28);
    }
  }

  function focusOnDecoy() {
    const decoys = window.DecoyEngine ? DecoyEngine.getDeployed() : [];
    if (decoys.length && nodeMeshes[decoys[0]]) focusOn(decoys[0], 36);
  }

  function focusOnProcess() {
    if (!processGroup) return;
    const pPos = processGroup.position;
    if (window.gsap) {
      gsap.to(controls.target, { x: pPos.x, y: pPos.y, z: pPos.z, duration: 1.0, ease: 'power2.inOut' });
      gsap.to(camera.position, { x: pPos.x + 18, y: pPos.y + 16, z: pPos.z + 24, duration: 1.0, ease: 'power2.inOut' });
    } else {
      controls.target.copy(pPos);
      camera.position.set(pPos.x + 18, pPos.y + 16, pPos.z + 24);
    }
  }

  function resetCamera() {
    if (window.gsap) {
      gsap.to(camera.position, { x: 0, y: 32, z: 54, duration: 1.2, ease: 'power2.inOut' });
      gsap.to(controls.target, { x: 0, y: 4.5, z: 0, duration: 1.2, ease: 'power2.inOut' });
    } else {
      camera.position.set(0, 32, 54);
      controls.target.set(0, 4.5, 0);
    }
  }

  function toggleAutoOrbit() {
    autoOrbit = !autoOrbit;
    return autoOrbit;
  }

  function isAutoOrbit() {
    return autoOrbit;
  }

  /* ---------------- Interaction & Raycasting ---------------- */

  function onMouseMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const meshes = Object.values(nodeMeshes).map(g => g.userData.mesh).filter(Boolean);
    const hits = raycaster.intersectObjects(meshes);

    if (hits.length) {
      const id = hits[0].object.userData.nodeId;
      if (hoveredNodeId !== id) {
        hoveredNodeId = id;
        renderer.domElement.style.cursor = 'pointer';
        updateTargetReticle(nodeMeshes[id]);
        updateTelemetryDataPlate(id);
        if (onNodeHoverCallback) onNodeHoverCallback(id);
      }
    } else if (hoveredNodeId) {
      hoveredNodeId = null;
      renderer.domElement.style.cursor = 'default';
      updateTargetReticle(null);
      updateTelemetryDataPlate(null);
      if (onNodeHoverCallback) onNodeHoverCallback(null);
    }
  }

  function onClick(e) {
    let targetId = hoveredNodeId;
    if (e && renderer && camera) {
      const rect = renderer.domElement.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(clickMouse, camera);
      const meshes = Object.values(nodeMeshes).map(g => g.userData.mesh).filter(Boolean);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length) {
        targetId = hits[0].object.userData.nodeId;
      }
    }

    if (targetId && onNodeClickCallback) {
      selectedNodeId = targetId;
      hoveredNodeId = targetId;
      onNodeClickCallback(targetId);
      updateTargetReticle(nodeMeshes[targetId]);
      updateTelemetryDataPlate(targetId);
    }
  }

  function setNodeClickHandler(fn) { onNodeClickCallback = fn; }
  function setNodeHoverHandler(fn) { onNodeHoverCallback = fn; }

  /* ---------------- Main Animation Loop ---------------- */

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const t = clock.getElapsedTime();

    // 1. Cinematic Camera Auto-Orbit
    if (autoOrbit && controls) {
      orbitAngle += dt * 0.22;
      const camY = 24 + Math.sin(t * 0.4) * 6;
      camera.position.x = Math.sin(orbitAngle) * orbitRadius;
      camera.position.z = Math.cos(orbitAngle) * orbitRadius;
      camera.position.y = camY;
      controls.target.set(0, 4.5, 0);
    }

    // 2. Ambient Cyber Dust Drift
    if (starfieldPoints) {
      const pos = starfieldPoints.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += dt * 0.4;
        if (pos[i + 1] > 38) pos[i + 1] = 0.5;
      }
      starfieldPoints.geometry.attributes.position.needsUpdate = true;
      starfieldPoints.rotation.y = t * 0.02;
    }

    // 3. Ground Radar Beam Sweep & Wave
    if (radarBeamMesh) {
      radarBeamMesh.rotation.z -= dt * 0.85; // 360 deg sweep
    }
    if (radarWaveMesh) {
      const cycle = (t * 0.28) % 1.0;
      const scale = 0.1 + cycle * 38;
      radarWaveMesh.scale.set(scale, scale, 1);
      radarWaveMesh.material.opacity = (1 - cycle) * 0.45;
    }

    // 4. Continuous Conduit Traffic (Glowing Network Packets)
    conduitPackets.forEach(p => {
      p.t += dt * p.speed;
      if (p.t > 1) {
        p.t = 0;
        p.reverse = !p.reverse;
      }
      const actualT = p.reverse ? 1 - p.t : p.t;
      p.mesh.position.lerpVectors(p.from, p.to, actualT);
      p.mesh.position.y += Math.sin(actualT * Math.PI) * 0.3; // subtle arc
    });

    // 5. Targeting Reticle Spin & Pulse
    if (targetReticle && targetReticle.visible) {
      targetReticle.children[0].rotation.z += dt * 1.5;
    }

    // 6. Gentle floating and spinning for nodes
    Object.values(nodeMeshes).forEach(g => {
      g.position.y = g.userData.baseY + Math.sin(t * 1.2 + g.userData.floatOffset) * 0.12;

      // Corrupted file jitter
      if (g.userData.isCorrupted) {
        g.rotation.z = Math.sin(t * 24.0) * 0.04;
        g.position.x += (Math.random() - 0.5) * 0.02;
      }

      if (g.userData.isDecoy) {
        g.children.forEach(c => {
          if (c.userData && c.userData.spinX) c.rotation.x += dt * c.userData.spinX;
          if (c.userData && c.userData.spinY) c.rotation.y += dt * c.userData.spinY;
          if (c.userData && c.userData.spinZ) c.rotation.z += dt * c.userData.spinZ;
          if (c.userData && c.userData.isBeacon) {
            c.material.opacity = 0.35 + Math.sin(t * 4.0) * 0.15;
          }
        });
        g.rotation.y += dt * 0.6;
      }
    });

    // 7. Node pulse decay
    Object.keys(pulsingNodes).forEach(id => {
      const p = pulsingNodes[id];
      const g = nodeMeshes[id];
      if (g && !g.userData.isCorrupted) {
        const colHex = p.kind === 'suspicious' ? COLORS.red : p.kind === 'decoy' ? COLORS.purple : COLORS.cyan;
        g.userData.mesh.material.emissive.setHex(colHex);
        g.userData.mesh.material.emissiveIntensity = 0.4 + p.intensity * 1.6;
        g.userData.halo.material.opacity = 0.08 + p.intensity * 0.35;
        g.userData.halo.material.color.setHex(colHex);
      }
      p.intensity -= dt * 1.3;
      if (p.intensity <= 0) {
        if (g && !g.userData.isCorrupted) {
          g.userData.mesh.material.emissive.copy(g.userData.baseEmissive || g.userData.baseColor).multiplyScalar(0.4);
          g.userData.halo.material.color.copy(g.userData.baseColor);
          g.userData.halo.material.opacity = g.userData.isDecoy ? 0.26 : 0.08;
        }
        delete pulsingNodes[id];
      }
    });

    // 8. Moving Telemetry Particles
    particles = particles.filter(p => {
      p.t += dt * p.speed;
      if (p.t >= 1) {
        scene.remove(p.mesh);
        if (p.onArrive) p.onArrive();
        if (p.toId) {
          pulseNode(p.toId, p.color === COLORS.red ? 'suspicious' : p.color === COLORS.purple ? 'decoy' : 'normal');
        }
        return false;
      }
      p.mesh.position.lerpVectors(p.from, p.to, p.t);
      p.mesh.position.y += Math.sin(p.t * Math.PI) * 2.8;
      return true;
    });

    // 9. Detection Shockwaves & EMP Domes
    shockwaves = shockwaves.filter(s => {
      s.t += dt * 1.4;
      if (s.t >= 1) {
        scene.remove(s.mesh);
        return false;
      }
      const sc = 1 + s.t * s.maxScale;
      s.mesh.scale.set(sc, sc, sc);
      s.mesh.material.opacity = 1.0 * (1 - s.t);
      return true;
    });

    // 9b. Digital Debris Explosion Fragments
    digitalDebris = digitalDebris.filter(d => {
      d.age += dt;
      if (d.age >= d.maxAge) {
        scene.remove(d.mesh);
        return false;
      }
      d.mesh.position.addScaledVector(d.vel, dt);
      d.vel.y -= 4.2 * dt; // gravity
      d.mesh.rotation.x += d.rotSpeed * dt;
      d.mesh.rotation.y += d.rotSpeed * dt;
      d.mesh.material.opacity = Math.max(0, 1.0 - (d.age / d.maxAge));
      return true;
    });

    // 9c. Protective Shield Forcefield Bubbles
    protectionBubbles = protectionBubbles.filter(b => {
      b.age += dt;
      if (b.age >= b.maxAge) {
        b.parent.remove(b.mesh);
        return false;
      }
      b.mesh.rotation.y += dt * 0.9;
      b.mesh.rotation.z += dt * 0.45;
      const life = 1.0 - (b.age / b.maxAge);
      b.mesh.material.opacity = life * 0.75;
      return true;
    });

    // 10. Holographic Cyber AI Core Animations
    if (aiCoreGroup) {
      const speedMult = aiCoreLevel === 'critical' ? 2.5 : aiCoreLevel === 'high' ? 1.8 : 1.0;
      aiCoreGroup.userData.rings.forEach(r => {
        r.rotation.x += dt * r.userData.spinSpeed * speedMult;
        r.rotation.y += dt * (r.userData.spinSpeed * 0.8) * speedMult;
      });
      aiCoreGroup.userData.shell.rotation.y -= dt * 0.3 * speedMult;
      aiCoreGroup.userData.shell.rotation.x += dt * 0.15;
      aiCoreGroup.userData.core.rotation.y += dt * 0.5 * speedMult;
      aiCoreGroup.userData.scanCone.rotation.y += dt * 0.25 * speedMult;

      aiCoreGroup.userData.sparks.forEach(sp => {
        sp.userData.angle += dt * sp.userData.speed * speedMult;
        sp.position.x = Math.cos(sp.userData.angle) * sp.userData.orbitR;
        sp.position.z = Math.sin(sp.userData.angle) * sp.userData.orbitR;
        sp.position.y = Math.sin(sp.userData.pitch + sp.userData.angle * 0.5) * sp.userData.orbitR * 0.4;
      });

      aiCoreGroup.position.y = 19 + Math.sin(t * 0.9) * 0.45;
    }

    // 11. Active Process Drone Animations
    if (processGroup) {
      processGroup.children.forEach(c => {
        if (c.userData.spin) c.rotation.z += dt * c.userData.spin;
        if (c.userData.isLaserCone) {
          c.material.opacity = 0.35 + Math.random() * 0.35;
        }
        if (c.userData.isThruster) {
          const fl = 0.85 + Math.random() * 0.45;
          c.scale.set(fl, 0.8 + Math.random() * 0.65, fl);
        }
        if (c.userData.isSearchlight) {
          c.rotation.z = Math.sin(t * 3.8) * 0.32;
          c.rotation.x = Math.cos(t * 3.0) * 0.22;
          c.material.opacity = 0.18 + Math.sin(t * 7.0) * 0.08;
        }
      });
      if (!processState.isIsolated) {
        processGroup.position.y += Math.sin(t * 3.5) * 0.012;
      }
    }

    // 12. Containment Cage & Electric Zap Sparks
    if (containmentCage) {
      containmentCage.userData.cageMesh.rotation.y += dt * 0.6;
      containmentCage.userData.cageMesh.rotation.x += dt * 0.35;
      containmentCage.userData.barrierMesh.material.opacity = 0.35 + Math.sin(t * 5.0) * 0.15;

      containmentCage.userData.zapGroup.children.forEach(zm => {
        zm.userData.angle += dt * zm.userData.speed;
        zm.position.x = Math.cos(zm.userData.angle) * zm.userData.r;
        zm.position.z = Math.sin(zm.userData.angle) * zm.userData.r;
        zm.position.y = Math.sin(zm.userData.angle * 2.0) * (zm.userData.r * 0.8);
      });
    }

    // 13. Alert Strobe Flash
    if (alertLight && alertLight.intensity > 0) {
      alertLight.intensity = (aiCoreLevel === 'critical') ? (0.8 + Math.sin(t * 12.0) * 0.6) : 0.5;
    }

    // 14. Security Shield Rotation
    if (securityShield) securityShield.rotation.y += dt * 0.04;

    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  function reset() {
    removeProcess();
    Object.keys(pulsingNodes).forEach(id => delete pulsingNodes[id]);
    particles.forEach(p => scene.remove(p.mesh));
    particles = [];
    shockwaves.forEach(s => scene.remove(s.mesh));
    shockwaves = [];

    // Clear corrupted nodes
    Object.keys(corruptedNodes).forEach(id => {
      const g = nodeMeshes[id];
      if (g) {
        g.userData.isCorrupted = false;
        g.userData.mesh.material.color.copy(corruptedNodes[id].origColor);
        g.userData.mesh.material.emissive.copy(corruptedNodes[id].origEmissive);
        g.userData.mesh.material.emissiveIntensity = 0.55;
        if (corruptedNodes[id].wireCage) g.remove(corruptedNodes[id].wireCage);

        // Restore clean billboard label
        const fsNode = window.FileSystem ? FileSystem.get(id) : null;
        if (fsNode) {
          g.remove(g.userData.labelSprite);
          const cleanSprite = createBillboardLabel('📄 ' + fsNode.name, 'file', false, false);
          cleanSprite.position.set(0, 1.7, 0);
          g.add(cleanSprite);
          g.userData.labelSprite = cleanSprite;
        }
      }
    });
    corruptedNodes = {};

    updateSecurityShield('normal');
    setAICoreLevel('low');
    autoOrbit = false;
    resetCamera();

    digitalDebris.forEach(d => scene.remove(d.mesh));
    digitalDebris = [];
    protectionBubbles.forEach(b => {
      if (b.parent) b.parent.remove(b.mesh);
    });
    protectionBubbles = [];
    if (neuralDownlinkMesh) {
      scene.remove(neuralDownlinkMesh);
      neuralDownlinkMesh = null;
    }
    if (telemetryDataPlate) {
      telemetryDataPlate.visible = false;
    }
    resetSectorAlerts();
  }

  return {
    init,
    onResize,
    buildFileSystem,
    updateSecurityShield,
    spawnParticle,
    pulseNode,
    spawnDecoy,
    corruptNode,
    triggerDecoyEmp,
    addNodeMeshFor,
    spawnProcess,
    moveProcessTo,
    isolateProcess,
    removeProcess,
    detectionShockwave,
    focusOn,
    focusOnAICore,
    focusOnDecoy,
    focusOnProcess,
    resetCamera,
    toggleAutoOrbit,
    isAutoOrbit,
    setAICoreLevel,
    setNodeClickHandler,
    setNodeHoverHandler,
    getProcessState: () => ({ ...processState }),
    getNodeMeshCount: () => Object.keys(nodeMeshes).length,
    updateSectorAlert,
    resetSectorAlerts,
    triggerProtectionBubbleWave,
    spawnNeuralDownlink,
    updateTelemetryDataPlate,
    reset
  };
})();

window.SceneManager = SceneManager;
