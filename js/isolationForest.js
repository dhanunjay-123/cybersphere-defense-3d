/* =========================================================
   isolationForest.js
   A genuine (not simulated) Isolation Forest implementation,
   following Liu, Ting & Zhou (2008). This lets the app run a
   real unsupervised anomaly-detection model entirely in the
   browser with no backend, while js/backendClient.js can
   swap in the scikit-learn version transparently when a
   Python backend is available (see backend/main.py).

   Trees are built by recursively splitting a random feature
   at a random threshold; anomalies are isolated in fewer
   splits than normal points, so their average path length
   across the forest is shorter. The final score uses the
   standard normalization constant c(n).
   ========================================================= */

class IsolationTree {
  constructor(heightLimit) {
    this.heightLimit = heightLimit;
    this.root = null;
  }

  build(data, height = 0) {
    if (height >= this.heightLimit || data.length <= 1) {
      return { isExternal: true, size: data.length };
    }
    const dims = data[0].length;
    const feature = Math.floor(Math.random() * dims);

    let min = Infinity, max = -Infinity;
    for (const row of data) {
      if (row[feature] < min) min = row[feature];
      if (row[feature] > max) max = row[feature];
    }
    if (min === max) {
      return { isExternal: true, size: data.length };
    }

    const splitValue = min + Math.random() * (max - min);
    const left = data.filter(row => row[feature] < splitValue);
    const right = data.filter(row => row[feature] >= splitValue);

    return {
      isExternal: false,
      feature,
      splitValue,
      left: this.build(left, height + 1),
      right: this.build(right, height + 1)
    };
  }

  fit(data) {
    this.root = this.build(data, 0);
  }

  pathLength(x, node = this.root, height = 0) {
    if (!node || node.isExternal) {
      return height + c(node ? node.size : 1);
    }
    if (x[node.feature] < node.splitValue) {
      return this.pathLength(x, node.left, height + 1);
    }
    return this.pathLength(x, node.right, height + 1);
  }
}

// Average path length of an unsuccessful search in a Binary
// Search Tree of n nodes — the standard normalization term.
function c(n) {
  if (n <= 1) return 0;
  const H = Math.log(n - 1) + 0.5772156649; // harmonic number approx (Euler-Mascheroni)
  return 2 * H - (2 * (n - 1) / n);
}

class IsolationForest {
  constructor({ numTrees = 80, sampleSize = 64 } = {}) {
    this.numTrees = numTrees;
    this.sampleSize = sampleSize;
    this.trees = [];
    this.trainingSize = 0;
  }

  fit(data) {
    this.trainingSize = data.length;
    const heightLimit = Math.ceil(Math.log2(Math.max(2, this.sampleSize)));
    this.trees = [];
    for (let i = 0; i < this.numTrees; i++) {
      const sample = sampleWithoutReplacement(data, Math.min(this.sampleSize, data.length));
      const tree = new IsolationTree(heightLimit);
      tree.fit(sample);
      this.trees.push(tree);
    }
  }

  // Returns an anomaly score in [0, 1]. Values near 1 mean
  // "isolated in very few splits" i.e. anomalous; values near
  // 0.5 or below mean the point behaves like the training
  // (normal) distribution.
  score(x) {
    if (!this.trees.length) return 0;
    const avgPath = this.trees.reduce((sum, t) => sum + t.pathLength(x), 0) / this.trees.length;
    const norm = c(this.sampleSize);
    if (norm === 0) return 0;
    return Math.pow(2, -avgPath / norm);
  }
}

function sampleWithoutReplacement(arr, n) {
  const copy = arr.slice();
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

// Exposed for use by other modules and for unit-style sanity checks.
window.IsolationForest = IsolationForest;
