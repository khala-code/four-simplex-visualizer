// App.tsx
import React, { useState } from "react"
import {
  MetricSpec,
  SimplexConfig,
  computeParityBits
} from "./components/simplex-core"
import { SimplexVisualizer } from "./components/simplex-visualizer"
import { Simplex3D } from "./components/simplex-scene"

const defaultMetrics: MetricSpec[] = [
  { id: 0, name: "H", min: 0.15, max: 0.35 },
  { id: 1, name: "L", min: 0.15, max: 0.35 },
  { id: 2, name: "M", min: 0.15, max: 0.35 },
  { id: 3, name: "P", min: 0.15, max: 0.35 }
]

export const App: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricSpec[]>(defaultMetrics)
  const [raw, setRaw] = useState<number[]>([1, 1, 1, 1])

  // Always build a full config object here
  const config: SimplexConfig = {
    metrics,
    lambdaScale: 1
  }

  const result = computeParityBits(raw, config)

  const updateMetric = (index: number, patch: Partial<MetricSpec>) => {
    setMetrics(prev =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m))
    )
  }

  const updateRaw = (index: number, value: string) => {
    const v = Number(value)
    setRaw(prev =>
      prev.map((x, i) => (i === index ? (isNaN(v) ? 0 : v) : x))
    )
  }

  return (
    <div style={{ padding: 32, color: "#eee", background: "#111", minHeight: "100vh" }}>
      <h1>Four Simplex</h1>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        {/* Left: controls */}
        <div>
          <h3>Axes &amp; healthy region</h3>
          {metrics.map((m, i) => (
            <div key={m.id} style={{ marginBottom: 8 }}>
              <input
                value={m.name}
                onChange={e => updateMetric(i, { name: e.target.value })}
                style={{ width: 40, marginRight: 8 }}
              />
              <label>
                min
                <input
                  type="number"
                  step="0.01"
                  value={m.min}
                  onChange={e =>
                    updateMetric(i, { min: Number(e.target.value) })
                  }
                  style={{ width: 60, marginLeft: 4, marginRight: 8 }}
                />
              </label>
              <label>
                max
                <input
                  type="number"
                  step="0.01"
                  value={m.max}
                  onChange={e =>
                    updateMetric(i, { max: Number(e.target.value) })
                  }
                  style={{ width: 60, marginLeft: 4 }}
                />
              </label>
            </div>
          ))}

          <h3>Raw estimates</h3>
          {raw.map((v, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <span style={{ width: 20, display: "inline-block" }}>
                {metrics[i]?.name ?? `m${i + 1}`}
              </span>
              <input
                type="number"
                value={v}
                min={0}
                onChange={e => updateRaw(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Middle: diagnostic readout */}
        <div>
          <h3>Diagnostic</h3>
          <p>
            Normalized w = [
            {result.normalizedW.map(v => v.toFixed(3)).join(", ")}]
          </p>
          <p>Distance from centroid: {result.distanceFromCentroid.toFixed(3)}</p>
          <p>x (lamb/wolf scalar): {result.x.toFixed(3)}</p>
          <p>
            Bit A (good polytope):{" "}
            {result.parity.insideGoodPolytope ? "OUTSIDE (1)" : "INSIDE (0)"}
          </p>
          <p>
            Bit B (orientation):{" "}
            {result.parity.lambward ? "LAMB (1)" : "WOLF (0)"}
          </p>
        </div>

        {/* Right: visualizer (only render when metrics are ready) */}
        {metrics.length === 4 && (
          <Simplex3D config={config} result={result} />
        )}
      </div>
    </div>
  )
}