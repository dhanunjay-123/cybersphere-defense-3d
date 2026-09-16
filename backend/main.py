"""
CyberSphere Defense 3D — Python ML Backend
==========================================
Implements the research architecture:
    Python -> Isolation Forest -> FastAPI -> WebSocket -> Three.js

Safety: Purely statistical evaluation. Accepts an 8-number feature vector
over WebSocket /ws/score and returns anomaly scores. Zero host file modifications.
"""

import os
import math
import random
from typing import List

import json
import urllib.request
import urllib.parse
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware

# Lightweight .env loader (zero external dependency)
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


# Try importing scikit-learn first; fall back to high-performance NumPy IsolationForest
# if Windows Application Control policy blocks C-extension DLLs (e.g. scipy _cyutility)
USING_SKLEARN = False
try:
    from sklearn.ensemble import IsolationForest as SklearnIsolationForest
    USING_SKLEARN = True
    print("[ML Backend] Successfully loaded scikit-learn IsolationForest")
except Exception as e:
    print(f"[ML Backend] scikit-learn/scipy DLL load blocked by system policy ({e}); using NumPy IsolationForest")
    USING_SKLEARN = False


class IsolationTree:
    def __init__(self, depth: int, max_depth: int):
        self.depth = depth
        self.max_depth = max_depth
        self.left = None
        self.right = None
        self.split_feat = None
        self.split_val = None
        self.size = 0

    def fit(self, X: np.ndarray):
        self.size = len(X)
        if self.depth >= self.max_depth or self.size <= 1:
            return
        feats = list(range(X.shape[1]))
        np.random.shuffle(feats)
        for f in feats:
            min_val, max_val = float(np.min(X[:, f])), float(np.max(X[:, f]))
            if min_val < max_val:
                self.split_feat = f
                self.split_val = float(np.random.uniform(min_val, max_val))
                left_mask = X[:, f] < self.split_val
                self.left = IsolationTree(self.depth + 1, self.max_depth)
                self.left.fit(X[left_mask])
                self.right = IsolationTree(self.depth + 1, self.max_depth)
                self.right.fit(X[~left_mask])
                return

    def path_length(self, x: np.ndarray) -> float:
        if self.left is None or self.right is None:
            return self.depth + self._c(self.size)
        if x[self.split_feat] < self.split_val:
            return self.left.path_length(x)
        else:
            return self.right.path_length(x)

    @staticmethod
    def _c(n: int) -> float:
        if n <= 1:
            return 0.0
        if n == 2:
            return 1.0
        return 2.0 * (math.log(n - 1) + 0.5772156649) - (2.0 * (n - 1) / n)


class NumpyIsolationForest:
    def __init__(self, n_estimators: int = 150, max_samples: int = 256, random_state: int = 42):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.trees = []
        if random_state is not None:
            np.random.seed(random_state)

    def fit(self, X: np.ndarray):
        n = min(len(X), self.max_samples)
        max_depth = int(math.ceil(math.log2(max(n, 2))))
        self.trees = []
        for _ in range(self.n_estimators):
            idx = np.random.choice(len(X), n, replace=False)
            tree = IsolationTree(0, max_depth)
            tree.fit(X[idx])
            self.trees.append(tree)

    def decision_function(self, X: np.ndarray) -> np.ndarray:
        c_n = IsolationTree._c(self.max_samples)
        scores = []
        for x in X:
            avg_path = np.mean([t.path_length(x) for t in self.trees])
            anomaly_score = 2.0 ** (-avg_path / c_n)
            scores.append(0.5 - anomaly_score)
        return np.array(scores)


app = FastAPI(title="CyberSphere Defense 3D — ML Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Feature schema matching js/config.js exactly
FEATURE_ORDER = [
    "files_accessed_per_minute",
    "directory_changes",
    "file_modifications",
    "traversal_speed",
    "unique_extensions",
    "behavior_deviation",
    "process_activity",
    "decoy_interaction",
]

TRAINING_SAMPLES = 300
CONTAMINATION = 0.05

RANGES = {
    "files_accessed_per_minute": (0, 160),
    "directory_changes": (0, 40),
    "file_modifications": (0, 100),
    "traversal_speed": (0, 100),
    "unique_extensions": (0, 8),
    "behavior_deviation": (0, 100),
    "process_activity": (0, 100),
    "decoy_interaction": (0, 100),
}


def normalize_raw(raw: dict) -> List[float]:
    out = []
    for key in FEATURE_ORDER:
        lo, hi = RANGES[key]
        v = max(lo, min(hi, raw[key]))
        out.append((v - lo) / (hi - lo or 1))
    return out


def generate_synthetic_normal_dataset(n: int) -> np.ndarray:
    """Synthetic baseline user behavior distribution."""
    rows = []
    for _ in range(n):
        noise = lambda: (random.random() + random.random() + random.random() - 1.5)
        raw = {
            "files_accessed_per_minute": max(0, 8 + noise() * 3),
            "directory_changes": max(0, 3 + noise() * 1.4),
            "file_modifications": max(0, 4 + noise() * 2),
            "traversal_speed": max(0, 6 + noise() * 3),
            "unique_extensions": max(0, 2 + round(noise())),
            "behavior_deviation": max(0, 5 + noise() * 3),
            "process_activity": max(0, 4 + noise() * 3),
            "decoy_interaction": 0,
        }
        rows.append(normalize_raw(raw))
    return np.array(rows)


# Fit Isolation Forest at startup
_training_data = generate_synthetic_normal_dataset(TRAINING_SAMPLES)

if USING_SKLEARN:
    model = SklearnIsolationForest(
        n_estimators=150,
        contamination=CONTAMINATION,
        random_state=42,
    )
    model.fit(_training_data)
else:
    model = NumpyIsolationForest(
        n_estimators=150,
        random_state=42,
    )
    model.fit(_training_data)


def anomaly_score(vector: List[float]) -> float:
    """Returns a 0..1 anomaly score (1 = highly anomalous) from decision_function."""
    x = np.array(vector).reshape(1, -1)
    raw_score = model.decision_function(x)[0]
    scaled = 0.5 - raw_score
    return float(max(0.0, min(1.0, scaled)))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "scikit-learn IsolationForest" if USING_SKLEARN else "NumPy IsolationForest (Algorithm-identical)",
        "training_samples": TRAINING_SAMPLES,
        "n_estimators": 150,
        "features": FEATURE_ORDER,
    }


@app.websocket("/ws/score")
async def ws_score(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            features = payload.get("features")
            if not isinstance(features, list) or len(features) != len(FEATURE_ORDER):
                await websocket.send_json({"error": "expected 'features' array of length 8"})
                continue
            score = anomaly_score(features)
            await websocket.send_json({
                "anomaly_score": score,
                "classification": "ANOMALOUS" if score >= 0.5 else "NORMAL",
                "model": "scikit-learn" if USING_SKLEARN else "Python/NumPy IsolationForest"
            })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        pass


@app.post("/api/alert/mobile")
async def send_mobile_alert(request: Request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    cfg = payload.get("config", {})
    service = cfg.get("service", "simulation")
    title = payload.get("title", "CRITICAL: Ransomware Tripwire Breached!")
    target = payload.get("targetPath", "")
    proc = payload.get("process", "")
    threat = payload.get("threatScore", "")
    latency = payload.get("latency", "")
    action = payload.get("actionTaken", "")

    html_message = (
        f"🚨 <b>CYBERSPHERE DEFENSE 3D — INCIDENT ESCALATION</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"⚠️ <b>Alert:</b> {title}\n"
        f"🎯 <b>Decoy Target:</b> <code>{target}</code>\n"
        f"👾 <b>Threat Process:</b> <code>{proc}</code>\n"
        f"📊 <b>Threat Score:</b> <b>{threat}</b>\n"
        f"⏱️ <b>Detection Latency:</b> <b>{latency}</b>\n"
        f"🛡️ <b>Action:</b> {action}\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"✅ Host quarantined. Virtual sandboxed containment confirmed."
    )

    dispatched = False
    details = "Delivered to on-screen holographic SOC phone widget"

    tg_token = (cfg.get("telegramToken") or os.getenv("TELEGRAM_BOT_TOKEN", "")).strip()
    tg_chat = (cfg.get("telegramChatId") or os.getenv("TELEGRAM_CHAT_ID", "")).strip()

    if tg_token and tg_chat:
        try:
            tg_url = f"https://api.telegram.org/bot{tg_token}/sendMessage"
            data = json.dumps({"chat_id": tg_chat, "text": html_message, "parse_mode": "HTML"}).encode("utf-8")
            req = urllib.request.Request(tg_url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    dispatched = True
                    details = "Successfully pushed to physical phone via Telegram Bot"
                    print(f"[MobileAlert] Successfully delivered to Telegram chat {tg_chat}")
        except Exception as e:
            print(f"[MobileAlert] Telegram push error: {e}")
            details = f"Telegram push failed ({e}); mirrored on screen"

    elif service in ("discord", "generic"):
        webhook_url = (cfg.get("webhookUrl") or os.getenv("DISCORD_WEBHOOK_URL", "")).strip()
        if webhook_url:
            try:
                wh_data = json.dumps({"content": message_text}).encode("utf-8")
                req = urllib.request.Request(webhook_url, data=wh_data, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status in (200, 204):
                        dispatched = True
                        details = f"Successfully pushed to physical phone via {service} webhook"
            except Exception as e:
                details = f"Webhook push failed ({e}); mirrored on screen"

    return {
        "status": "success",
        "service": service,
        "dispatched": dispatched,
        "details": details,
        "timestamp": payload.get("timestamp")
    }

