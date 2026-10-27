"""
FloodLens inference backend.

Loads the trained U-Net checkpoint (from Phase 2 or Phase 4) and serves a
single endpoint that takes a photo and returns a water-coverage reading.

Run locally:
    uvicorn main:app --host 0.0.0.0 --port 8000

Then expose it over HTTPS for phone testing with ngrok:
    ngrok http 8000
"""
import io
import os

import cv2
import numpy as np
import torch
import segmentation_models_pytorch as smp
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# --- Configuration ---
# Point this at whichever checkpoint you want to serve. Use the Phase 4
# fine-tuned one if you have it (better on local imagery); fall back to the
# Phase 2 FloodNet-only one otherwise.
CHECKPOINT_PATH = os.environ.get("FLOODLENS_CHECKPOINT", "best_model.pt")
IMG_SIZE = 256
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI(title="FloodLens Inference API")

# Wide-open CORS since this is a research prototype being called from a
# phone browser on an arbitrary network - tighten this if it's ever exposed
# beyond your own testing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


@app.on_event("startup")
def load_model():
    global model
    m = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None,  # weights come from the checkpoint, not ImageNet, at inference time
        in_channels=3,
        classes=1,
    )
    if os.path.exists(CHECKPOINT_PATH):
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
        m.load_state_dict(checkpoint["model_state_dict"])
        print(f"Loaded checkpoint: {CHECKPOINT_PATH}")
    else:
        print(f"WARNING: no checkpoint found at {CHECKPOINT_PATH}.")
        print("Serving with RANDOM UNTRAINED WEIGHTS - predictions will be meaningless.")
        print("Set the FLOODLENS_CHECKPOINT env var or place best_model.pt next to main.py.")
    m.to(DEVICE)
    m.eval()
    model = m


def classify_risk(coverage_percent: float) -> str:
    # Same thresholds as the frontend's mock, kept in sync manually since
    # frontend and backend are separate codebases here.
    if coverage_percent < 30:
        return "low"
    elif coverage_percent < 65:
        return "medium"
    return "high"


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(DEVICE),
        "checkpoint_loaded": os.path.exists(CHECKPOINT_PATH),
        "checkpoint_path": CHECKPOINT_PATH,
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read uploaded file as an image.")

    img_np = np.array(img)
    img_resized = cv2.resize(img_np, (IMG_SIZE, IMG_SIZE))
    img_norm = img_resized.astype(np.float32) / 255.0
    img_tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(img_tensor)
        probs = torch.sigmoid(logits)
        pred_mask = (probs > 0.5).float()

    coverage_percent = float(pred_mask.mean().item() * 100)
    risk_level = classify_risk(coverage_percent)

    return {
        "coverage_percent": round(coverage_percent, 2),
        "risk_level": risk_level,
        "checkpoint_loaded": os.path.exists(CHECKPOINT_PATH),
    }
