import { SimplexConfig, DiagnosticResult } from "./simplex-core"
import { normalizedMetricTargets } from "./simplex-core"

export interface DiagnosticSummary {
  headline: string
  status: "healthy" | "drift" | "at-risk"
  explanation: string
  drivers: string[]
}

export function summarizeDiagnostic(
  result: DiagnosticResult,
  config: SimplexConfig
): DiagnosticSummary {
  const metrics = normalizedMetricTargets(config.metrics)
  const w = result.simplexW

  const deviations = metrics.map((m, i) => {
    const delta = w[i] - m.target
    const absDelta = Math.abs(delta)
    const excess = Math.max(0, absDelta - m.tolerance)

    return {
      name: m.name,
      delta,
      absDelta,
      excess,
      direction: delta >= 0 ? "high" as const : "low" as const
    }
  })

  const sorted = [...deviations].sort((a, b) => b.excess - a.excess)
  const topDrivers = sorted.filter(d => d.excess > 1e-6).slice(0, 2)

  let status: DiagnosticSummary["status"] = "healthy"
  if (result.healthScore < 50) status = "at-risk"
  else if (result.healthScore < 80 || !result.parity.insideGoodPolytope) {
    status = "drift"
  }

  let headline = "Balanced and within healthy range."
  let explanation = "All four metrics are within their configured target bands."

  if (!result.parity.insideGoodPolytope && topDrivers.length > 0) {
    const first = topDrivers[0]
    headline = `${first.name} is running ${first.direction}.`
    explanation = `${first.name} is outside its target band, which pushes the point outside the healthy region.`

    if (topDrivers[1]) {
      explanation += ` A secondary contributor is ${topDrivers[1].name}.`
    }
  } else if (status === "drift") {
    headline = "Close to target, with slight drift."
    explanation = "The point is still near the desired balance, but one or more metrics are starting to drift."
  } else if (status === "at-risk") {
    headline = "Meaningful drift from target."
    explanation = "The current balance is materially away from the configured target profile."
  }

  const drivers = topDrivers.map(d => {
    const sign = d.delta >= 0 ? "+" : ""
    return `${d.name}: ${sign}${d.delta.toFixed(3)} vs target`
  })

  return {
    headline,
    status,
    explanation,
    drivers
  }
}
