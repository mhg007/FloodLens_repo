# FloodLens AR — Phase 5 (redesigned)

**Verified:** `npm install && npm run build` completes with no errors, and the
built output serves correctly (checked with a real static server, not assumed).

**Not verified:** actual in-browser interactivity (gauge animation, button
clicks, capability detection UI). I can't launch a real browser from where I'm
working — test those yourself and tell me if anything looks wrong.

## What this is

Three things at once:
1. A real webpage explaining what FloodLens does and why (hero + how-it-works)
2. A diagnostics console that checks WebXR support **before** you click
   anything, so "Enter AR does nothing" becomes a clear message instead of
   silence
3. A working AR session plus a gauge-style risk readout (currently mock data)

## Run it

```
npm install
npm run dev
```

Open the printed `Network` HTTPS URL on an Android phone in Chrome to test AR
for real. On desktop, the console will say AR isn't supported (expected — most
desktop browsers don't do camera-based AR) and let you run the mock analysis
anyway as a preview.

## Why "Enter AR" wasn't doing anything before

Desktop Chrome generally has no camera-based AR session support at all —
clicking the old button just failed silently with no feedback. This version
checks `navigator.xr.isSessionSupported('immersive-ar')` on load and disables
the button with an explanation if AR truly isn't available, and wraps the
actual session-start call in a try/catch that surfaces any real error message
in the UI instead of swallowing it.

## Design notes

Palette and layout are built around a "flood monitoring instrument" visual
language — contour lines, a gauge dial, sensor-diagnostic readouts — rather
than generic AR/sci-fi styling, so it visually ties to what the project
actually does. Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono
(data readouts).

## Still mock, not real

`analyzeMock()` in `src/App.jsx` returns a random risk value. Replacing it
with a real `fetch()` to a FastAPI endpoint serving your trained model is the
next step — say when you want that built.

## If npm install fails on a dependency conflict

package.json pins `zustand` explicitly. That's not arbitrary — `@react-three/fiber`
and `@react-three/xr` depend on different major versions of zustand internally,
and without pinning, npm's hoisting can pick the wrong one and break the build
with a "not exported by zustand" error. If this resurfaces after adding new
dependencies, run `npm ls zustand` to check for a new conflicting version.
