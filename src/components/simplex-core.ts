// metrics m1..m4: user-labels, but math treats them as indices 0..3
export type MetricId = 0 | 1 | 2 | 3

export interface MetricSpec {
  id: MetricId
  name: string               // e.g. "H", "L", "M", "P"
  min: number                // allowed barycentric lower bound inside "good"
  max: number                // allowed barycentric upper bound inside "good"
}

export interface SimplexConfig {
  metrics: MetricSpec[]      // len = 4, ids = 0..3
  centroid?: number[]        // optional custom centroid [c1..c4], sum=1
  lambdaScale?: number       // for scaling x if you want UI-friendly numbers
}

export interface SimplexState {
  w: number[]                // [w1..w4], sum≈1 after normalization
}

export interface ParityBits {
  insideGoodPolytope: boolean // Bit A: false = inside, true = outside
  lambward: boolean           // Bit B: true = lamb, false = wolf
}

export interface DiagnosticResult {
  normalizedW: number[]       // normalized barycentric coords
  distanceFromCentroid: number
  x: number                   // signed scalar, lamb/wolf
  parity: ParityBits
}

export function normalizeToSimplex(raw: number[]): number[] {
  if (raw.length !== 4) throw new Error("Need 4 coordinates")
  const clipped = raw.map(v => Math.max(0, v))
  const sum = clipped.reduce((a, b) => a + b, 0)
  if (sum === 0) {
    // default to centroid if user gives all zeros
    return [0.25, 0.25, 0.25, 0.25]
  }
  return clipped.map(v => v / sum)
}

export function isInsideGoodPolytope(
  w: number[],
  config: SimplexConfig
): boolean {
  const eps = 1e-9
  if (w.length !== 4 || config.metrics.length !== 4) return false

  // All barycentric coordinates must be >= 0, sum≈1
  if (w.some(v => v < -eps)) return false
  const sum = w.reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1) > 1e-3) return false

  // Per-axis constraints
  for (const m of config.metrics) {
    const v = w[m.id]
    if (v < m.min - eps || v > m.max + eps) {
      return false
    }
  }
  return true
}

function defaultCentroid(): number[] {
  return [0.25, 0.25, 0.25, 0.25]
}

function l2(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return Math.sqrt(s)
}

export function computeLambdaScalar(
  w: number[],
  config: SimplexConfig,
  inside: boolean
): { x: number; distance: number } {
  const c = config.centroid ?? defaultCentroid()
  const d = l2(w, c)

  // Cheap reference: worst-case “wolf corner” is the metric-most-violated vertex.
  // For v0..v3, we consider unit vertices e_i; pick the farthest from centroid.
  const vertices: number[][] = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]
  const distToVertices = vertices.map(v => l2(v, c))
  const maxDist = Math.max(...distToVertices) || 1

  const scale = config.lambdaScale ?? 1
  // If inside, always lamb-ward: x>0 (but small near centroid)
  if (inside) {
    return { x: (maxDist - d) * scale, distance: d }
  }
  // If outside, wolf-ward: x<0
  return { x: -d * scale, distance: d }
}

export function computeParityBits(
  w: number[],
  config: SimplexConfig
): DiagnosticResult {
  const normalizedW = normalizeToSimplex(w)
  const inside = isInsideGoodPolytope(normalizedW, config)
  const { x, distance } = computeLambdaScalar(normalizedW, config, inside)

  return {
    normalizedW,
    distanceFromCentroid: distance,
    x,
    parity: {
      insideGoodPolytope: !inside, // Bit A: 0=inside,1=outside -> boolean meaning "outside"
      lambward: x >= 0             // Bit B: true=lamb, false=wolf
    }
  }
}