import * as THREE from "three"
import { MetricSpec } from "./simplex-core"
import { barycentric4To3 } from "./simplex-3d"

export function isHealthyPoint(w: number[], metrics: MetricSpec[]): boolean {
  if (w.length !== 4 || metrics.length !== 4) return false

  const sum = w.reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1) > 1e-6) return false
  if (w.some(v => v < -1e-8)) return false

  return metrics.every((m, i) => Math.abs(w[i] - m.target) <= m.tolerance)
}

export function sampleHealthyBarycentricPoints(
  metrics: MetricSpec[],
  steps = 20
): number[][] {
  const points: number[][] = []

  for (let a = 0; a <= steps; a++) {
    for (let b = 0; b <= steps - a; b++) {
      for (let c = 0; c <= steps - a - b; c++) {
        const d = steps - a - b - c
        const w = [a / steps, b / steps, c / steps, d / steps]

        if (isHealthyPoint(w, metrics)) {
          points.push(w)
        }
      }
    }
  }

  return points
}

export function healthyRegionPoints3D(
  metrics: MetricSpec[],
  steps = 20
): THREE.Vector3[] {
  const baryPoints = sampleHealthyBarycentricPoints(metrics, steps)

  return baryPoints.map(w => {
    const [x, y, z] = barycentric4To3(w)
    return new THREE.Vector3(x, y, z)
  })
}