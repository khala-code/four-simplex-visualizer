// App.tsx
import React, { useState } from "react"
import {
  MetricSpec,
  SimplexConfig,
  computeParityBits
} from "./components/simplex-core"
import { Simplex3D } from "./components/simplex-scene"
import { summarizeDiagnostic } from "./components/summarizer"

const defaultMetrics: MetricSpec[] = [
  { id: 0, name: "H", target: 0.25, tolerance: 0.1 },
  { id: 1, name: "L", target: 0.25, tolerance: 0.1 },
  { id: 2, name: "M", target: 0.25, tolerance: 0.1 },
  { id: 3, name: "P", target: 0.25, tolerance: 0.1 }
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
  const summary = summarizeDiagnostic(result, config)

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

  const summaryColor =
    summary.status === "healthy"
      ? "#81c784"
      : summary.status === "drift"
      ? "#ffb74d"
      : "#e57373"

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
                target
                <input
                  type="number"
                  step="0.01"
                  value={m.target}
                  onChange={e =>
                    updateMetric(i, { target: Number(e.target.value) })
                  }
                  style={{ width: 60, marginLeft: 4, marginRight: 8 }}
                />
              </label>
              <label>
                tolerance
                <input
                  type="number"
                  step="0.01"
                  value={m.tolerance}
                  onChange={e =>
                    updateMetric(i, { tolerance: Number(e.target.value) })
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
          <div>
            <h3>Diagnostic</h3>
            <p>
              Normalized w = [
              {result.affineW.map(v => v.toFixed(3)).join(", ")}]
            </p>
            <p>Distance from centroid: {result.distanceFromCentroid.toFixed(3)}</p>
            <p>x (lamb/wolf scalar): {result.x.toFixed(3)}</p>
            <p>
              Bit A (good polytope):{" "}
              {result.parity.insideGoodPolytope ? "INSIDE (1)" : "OUTSIDE (0)"}
            </p>
            <p>
              Bit B (orientation):{" "}
              {result.parity.lambward ? "LAMB (1)" : "WOLF (0)"}
            </p>
          </div>
          <div style={{ marginTop: 16, maxWidth: 420 }}>
            <h4 style={{ marginBottom: 8 }}>Summary</h4>

            <p style={{ marginBottom: 8, color: summaryColor }}>
              <strong>{summary.headline}</strong>
            </p>

            <p style={{ marginBottom: 8, color: "#ccc" }}>
              {summary.explanation}
            </p>

            <p style={{ marginBottom: 8 }}>
              Status:{" "}
              {summary.status === "healthy"
                ? "Healthy"
                : summary.status === "drift"
                ? "Drift"
                : "At risk"}
            </p>

            {summary.drivers.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, color: "#bbb" }}>
                {summary.drivers.map(driver => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: visualizer (only render when metrics are ready) */}
        {metrics.length === 4 && (
          <Simplex3D config={config} result={result} />
        )}
      </div>
    </div>
  )
}