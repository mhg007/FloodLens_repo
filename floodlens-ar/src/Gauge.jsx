import { useEffect, useState } from 'react'

// A semicircular gauge styled like a water-level monitoring instrument.
// value: 0-100. Sweeps the needle on change rather than snapping, so a new
// reading feels like an instrument responding, not a UI element toggling.
export default function Gauge({ value, label, sublabel, color }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const start = displayValue
    const end = value
    const duration = 700
    const startTime = performance.now()

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayValue(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // semicircle: -90deg (0%) to +90deg (100%)
  const angle = -90 + (displayValue / 100) * 180
  const radius = 80
  const cx = 100
  const cy = 100

  // arc path for the background track (semicircle)
  const trackPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 120" className="gauge__svg">
        <path d={trackPath} className="gauge__track" />
        <path
          d={trackPath}
          className="gauge__fill"
          style={{
            stroke: color,
            strokeDasharray: `${(displayValue / 100) * 251.2} 251.2`,
          }}
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + radius * 0.75 * Math.cos((angle * Math.PI) / 180)}
          y2={cy + radius * 0.75 * Math.sin((angle * Math.PI) / 180)}
          className="gauge__needle"
          style={{ stroke: color }}
        />
        <circle cx={cx} cy={cy} r="4" className="gauge__hub" style={{ fill: color }} />
      </svg>
      <div className="gauge__readout">
        <span className="gauge__value" style={{ color }}>
          {Math.round(displayValue)}%
        </span>
        <span className="gauge__label">{label}</span>
        {sublabel && <span className="gauge__sublabel">{sublabel}</span>}
      </div>
    </div>
  )
}
