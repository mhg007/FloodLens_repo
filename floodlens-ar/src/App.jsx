import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import Gauge from './Gauge.jsx'
import './styles.css'

const store = createXRStore()

const RISK_LEVELS = {
  low: { hex: '#5FBE8C', label: 'Low risk', copy: 'Minimal standing water detected. Passable with normal caution.' },
  medium: { hex: '#F5A623', label: 'Moderate risk', copy: 'Noticeable water coverage. Consider an alternate route if on foot.' },
  high: { hex: '#EF6461', label: 'High risk', copy: 'Significant flooding detected. Avoid this route if possible.' },
}

const BACKEND_URL_KEY = 'floodlens_backend_url'

async function analyzeMock() {
  await new Promise((r) => setTimeout(r, 900))
  const value = Math.floor(Math.random() * 100)
  const level = value < 30 ? 'low' : value < 65 ? 'medium' : 'high'
  return { value, level, source: 'mock' }
}

async function analyzeReal(backendUrl, file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${backendUrl}/analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Backend returned ${response.status}`)
  }

  const data = await response.json()
  return {
    value: data.coverage_percent,
    level: data.risk_level,
    source: data.checkpoint_loaded ? 'model' : 'model (untrained checkpoint - not meaningful yet)',
  }
}

function ContourBackground() {
  const lines = Array.from({ length: 7 }).map((_, i) => {
    const yBase = 60 + i * 55
    const amp = 18 + i * 4
    return `M -50 ${yBase} C 150 ${yBase - amp}, 350 ${yBase + amp}, 550 ${yBase - amp / 2}, S 950 ${yBase + amp}, 1150 ${yBase}`
  })
  return (
    <svg className="contour-bg" viewBox="0 0 1080 500" preserveAspectRatio="none" aria-hidden="true">
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#375563" strokeWidth="1.2" />
      ))}
    </svg>
  )
}

function useXRSupport() {
  const [supported, setSupported] = useState('checking')
  useEffect(() => {
    if (!navigator.xr) {
      setSupported(false)
      return
    }
    navigator.xr
      .isSessionSupported('immersive-ar')
      .then((ok) => setSupported(ok))
      .catch(() => setSupported(false))
  }, [])
  return supported
}

export default function App() {
  const xrSupported = useXRSupport()
  const [arActive, setArActive] = useState(false)
  const [arError, setArError] = useState(null)
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem(BACKEND_URL_KEY) || '')
  const [analyzeError, setAnalyzeError] = useState(null)

  function handleBackendUrlChange(e) {
    const url = e.target.value.trim().replace(/\/$/, '')
    setBackendUrl(url)
    localStorage.setItem(BACKEND_URL_KEY, url)
  }

  async function handleEnterAR() {
    setArError(null)
    try {
      await store.enterAR()
      setArActive(true)
    } catch (err) {
      setArError(
        err?.message ||
          'Could not start an AR session. This usually means the browser or device does not support WebXR AR.'
      )
    }
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzeError(null)
    setAnalyzing(true)
    try {
      if (backendUrl) {
        const r = await analyzeReal(backendUrl, file)
        setResult(r)
      } else {
        setAnalyzeError('No backend URL set - showing mock data instead. Enter your backend URL above for a real reading.')
        const r = await analyzeMock()
        setResult(r)
      }
    } catch (err) {
      setAnalyzeError(`Backend request failed: ${err.message}. Falling back to mock data.`)
      const r = await analyzeMock()
      setResult(r)
    } finally {
      setAnalyzing(false)
      e.target.value = '' // allow re-selecting the same file
    }
  }

  async function handleMockAnalyze() {
    setAnalyzeError(null)
    setAnalyzing(true)
    const r = await analyzeMock()
    setResult(r)
    setAnalyzing(false)
  }

  const risk = result ? RISK_LEVELS[result.level] : null

  return (
    <div className="page">
      <header className="header">
        <div className="header__brand">
          <span className="header__title display">FloodLens</span>
          <span className="header__tag mono">AR Prototype · Phase 5</span>
        </div>
        <a href="#console" className="btn btn--ghost" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Open console
        </a>
      </header>

      <section className="hero">
        <ContourBackground />
        <div className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <span className="hero__eyebrow mono">Computational imaging &middot; Extended reality</span>
          <h1 className="hero__headline">See flood risk before you step in it.</h1>
          <p className="hero__sub">
            FloodLens reads a photo of a street for water coverage using a segmentation model
            trained on real flood imagery, then overlays the result directly on what your phone
            camera sees. This page is the AR layer of that pipeline — a working prototype, not a
            finished product.
          </p>
          <div className="hero__actions">
            <a href="#console" className="btn btn--primary">Try the console</a>
            <a href="#how" className="btn btn--ghost">How it works</a>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step__index mono">01</span>
            <h3 className="step__title">Capture</h3>
            <p className="step__body">A photo of the street is taken, either live through the camera or uploaded for a quick test.</p>
          </div>
          <div className="step">
            <span className="step__index mono">02</span>
            <h3 className="step__title">Read</h3>
            <p className="step__body">A segmentation model estimates what fraction of the visible ground is covered by standing water.</p>
          </div>
          <div className="step">
            <span className="step__index mono">03</span>
            <h3 className="step__title">Overlay</h3>
            <p className="step__body">The reading is drawn back into your view in AR, color-coded by risk, so it means something without reading a number.</p>
          </div>
        </div>
      </section>

      <section className="section" id="console">
        <div className="console">
          <div>
            <h2 className="console__title">AR console</h2>
            <p style={{ color: 'var(--text-dim)', marginTop: 8, fontSize: '0.92rem' }}>
              Checks your device before you try anything, so a failure is explained instead of silent.
            </p>

            <label className="backend-label mono" htmlFor="backend-url">
              BACKEND_URL
            </label>
            <input
              id="backend-url"
              className="backend-input mono"
              type="text"
              placeholder="https://your-ngrok-url.ngrok-free.app"
              value={backendUrl}
              onChange={handleBackendUrlChange}
            />

            <div className="diagnostics">
              <div className="diagnostic-row">
                <span
                  className={`diagnostic-dot ${
                    xrSupported === 'checking' ? 'diagnostic-dot--pending' : xrSupported ? 'diagnostic-dot--ok' : 'diagnostic-dot--bad'
                  }`}
                />
                <span>
                  WEBXR_AR_SUPPORT:{' '}
                  {xrSupported === 'checking' ? 'checking…' : xrSupported ? 'available' : 'not available on this browser/device'}
                </span>
              </div>
              <div className="diagnostic-row">
                <span className={`diagnostic-dot ${arActive ? 'diagnostic-dot--ok' : 'diagnostic-dot--pending'}`} />
                <span>AR_SESSION: {arActive ? 'active' : 'not started'}</span>
              </div>
              <div className="diagnostic-row">
                <span className={`diagnostic-dot ${backendUrl ? 'diagnostic-dot--ok' : 'diagnostic-dot--pending'}`} />
                <span>BACKEND: {backendUrl ? 'configured' : 'not set - will use mock data'}</span>
              </div>
            </div>

            {xrSupported === false && (
              <p className="console__note">
                Most desktop browsers don't support camera-based AR sessions at all — this is expected
                here, not a bug. Test on an Android phone using Chrome for a real AR session. Photo
                analysis below still works on desktop.
              </p>
            )}

            {arError && <div className="console__error">{arError}</div>}
            {analyzeError && <div className="console__error">{analyzeError}</div>}

            <div className="console__actions">
              <button className="btn btn--primary" onClick={handleEnterAR} disabled={xrSupported !== true}>
                Enter AR
              </button>

              <label className="btn btn--primary" style={{ display: 'inline-block' }}>
                {analyzing ? 'Analyzing…' : 'Take / choose photo'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelected}
                  disabled={analyzing}
                  style={{ display: 'none' }}
                />
              </label>

              <button className="btn btn--ghost" onClick={handleMockAnalyze} disabled={analyzing}>
                Run demo (mock)
              </button>
            </div>
          </div>

          <div className="gauge-panel">
            <Gauge
              value={result ? result.value : 0}
              label={risk ? risk.label : 'No reading yet'}
              sublabel={risk ? risk.copy : 'Take a photo or run the demo to see a reading here.'}
              color={risk ? risk.hex : '#7A8B93'}
            />
            {result && (
              <span className="mono result-source">
                source: {result.source}
              </span>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        FloodLens · Research prototype for computational imaging &amp; XR coursework — not a
        deployed early-warning system.
      </footer>

      <div className={`xr-canvas-wrap ${arActive ? '' : 'hidden'}`}>
        <Canvas>
          <XR store={store} onSessionEnd={() => setArActive(false)}>
            <ambientLight intensity={1} />
            {result && (
              <mesh position={[0, 0, -1.5]}>
                <planeGeometry args={[0.6, 0.4]} />
                <meshBasicMaterial color={risk.hex} transparent opacity={0.55} />
              </mesh>
            )}
          </XR>
        </Canvas>
        {arActive && <div className="xr-exit-hint">Exit AR from your browser/headset controls to return</div>}
      </div>
    </div>
  )
}
