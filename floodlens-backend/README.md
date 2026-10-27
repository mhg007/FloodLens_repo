# FloodLens Backend

**Verified working**: I ran this exact server locally, hit `/health`, POSTed
a real image to `/analyze` and got a proper JSON response, and confirmed a
malformed file returns a clean 400 error without crashing the server. Tested
with a randomly-initialized model (no checkpoint available to me) — the
plumbing is proven, your actual trained weights are not.

## Setup

```
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Get your checkpoint here

Download `best_model.pt` from your Google Drive (`FloodLens_checkpoints/` for
the Phase 2 FloodNet-only model, or `FloodLens_local_finetuned/` for the
Phase 4 fine-tuned one — the fine-tuned one should perform better on real
Karachi-style photos). Place it in this same folder as `main.py`.

## Run it

```
uvicorn main:app --host 0.0.0.0 --port 8000
```

Check `http://localhost:8000/health` — it should say `"checkpoint_loaded": true`.
If it says `false`, the server is running on random untrained weights and every
prediction will be meaningless (it'll still respond, just not usefully) — this
was deliberately built to warn loudly on startup rather than fail silently.

## Expose it over HTTPS for phone testing (required)

Your frontend runs over HTTPS. Browsers block a HTTPS page from calling a
plain HTTP backend, so this step isn't optional if you want real-time testing.

**ngrok** (fastest path):
```
# one-time setup: https://ngrok.com/download, then authenticate per their instructions
ngrok http 8000
```

This prints a public HTTPS URL like `https://abcd1234.ngrok-free.app`. Paste
that into the "BACKEND_URL" field in the FloodLens frontend console. This
works from any network, not just your home WiFi — genuinely real-time testing
from anywhere.

## API

**GET /health** → `{"status": "ok", "device": "cpu", "checkpoint_loaded": true, ...}`

**POST /analyze** (multipart form, field name `file`) → 
`{"coverage_percent": 12.4, "risk_level": "low", "checkpoint_loaded": true}`

## Known limitation

CORS is wide open (`allow_origins=["*"]`) since this is a research prototype
being called from an arbitrary phone browser during testing. Tighten this to
your specific frontend origin if this is ever exposed beyond your own testing.
