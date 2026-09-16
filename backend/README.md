# CyberSphere Defense 3D — optional Python ML backend

This folder implements the intended production architecture described in
the project spec:

```
Python -> scikit-learn -> IsolationForest -> FastAPI -> WebSocket -> Three.js
```

**This is entirely optional.** The app in the parent folder already runs a
complete, real Isolation Forest in the browser (`js/isolationForest.js`)
with zero setup — you do not need Python installed to demo the project.
Starting this backend simply upgrades the "ML anomaly" score to come from
a real scikit-learn model instead, and the topbar's **ML engine** chip
will switch from *"in-browser (Isolation Forest)"* to *"Python backend"*
automatically.

## Run it

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then open (or refresh) `index.html` in the browser as usual — no frontend
configuration is required, `js/backendClient.js` looks for
`ws://localhost:8000/ws/score` automatically on load.

## What it does

- Generates a synthetic "normal user behavior" dataset (same distribution
  the in-browser model uses) at startup.
- Fits a real `sklearn.ensemble.IsolationForest` on that dataset.
- Exposes a single WebSocket endpoint, `/ws/score`, that accepts
  `{"features": [8 numbers in 0..1]}` and returns
  `{"anomaly_score": 0..1}`.
- Exposes `GET /health` for a quick manual check.

## Safety

This service never touches the real filesystem, never spawns
subprocesses, and never executes anything the client sends — it only
scores an 8-number numeric vector against a pre-trained model.
