# FloodLens

Computer vision and augmented reality for flood risk visualization, built as a
research project for graduate applications in computational imaging and XR
(IMLEX, MSCV, and related Erasmus Mundus programs).

## What this is

A segmentation model reads a photo of a street for water coverage, is stress-tested
against degraded conditions (rain, fog, low light, glare), adapted toward local
Karachi imagery, and the result is surfaced through a WebXR AR interface — so a
prediction becomes something a person standing on a flooded street can actually
use, not just a number in a notebook.

## Structure

```
notebooks/          Google Colab notebooks, Phases 1-4
  Phase1  — data pipeline, OpenCV/PyTorch fundamentals, untrained baseline
  Phase2  — training a real segmentation baseline (Dice+BCE loss, checkpointing)
  Phase3  — robustness testing: synthetic degradation + classical enhancement
  Phase4  — local domain adaptation on Karachi/crowdsourced imagery

floodlens-ar/        React + WebXR frontend (Phase 5)
floodlens-backend/   FastAPI model-serving backend (Phase 5)
```

## Running the notebooks

Upload any `notebooks/*.ipynb` file to Google Colab, set the runtime to a T4
GPU, and run top to bottom. Each notebook is self-contained and documents its
own assumptions (dataset paths, checkpoint locations, etc.) in markdown cells.
Phase 2 onward expects the previous phase's checkpoint to exist in Google Drive.

## Running the AR demo

See `floodlens-ar/README.md` and `floodlens-backend/README.md` for setup.
Short version: the backend serves your trained model over an HTTP API, the
frontend is a WebXR app that captures a photo, sends it to the backend, and
renders the result as an AR overlay.

## Status

Phases 1-4 (the imaging/CV research) are complete and have been run
end-to-end. Phase 5 (the AR/XR layer) is a working prototype: the AR session,
capability detection, and UI are functional; the backend has been tested with
a placeholder model. End-to-end testing with the actual trained checkpoint on
a real device is the current open item.

## Motivation

Built as an applied research project connecting computational imaging,
illumination robustness, and extended reality — the same three areas IMLEX's
curriculum is structured around — grounded in a real, personally motivated
use case: urban flooding in Karachi.
