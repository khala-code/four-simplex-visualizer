// metrics m1..m4: user-labels, but math treats them as indices 0..3
export type MetricId = 0 | 1 | 2 | 3

export interface MetricSpec {
  id: MetricId
  name: string
  target: number      // expected normalized share
  tolerance: number   // allowed deviation from target
}

export interface ExternalFieldInfo {
  isExternal: boolean
  negativeAxes: number[]
  excessAxes: number[]
  externalMagnitude: number
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
  insideGoodPolytope: boolean // Bit A: true = inside, false = outside
  lambward: boolean           // Bit B: true = lamb, false = wolf
}

export interface DiagnosticResult {
  affineW: number[]           // signed, sums to 1
  simplexW: number[]          // projected inside simplex for visualization
  distanceFromCentroid: number
  x: number
  healthScore: number
  boundaryDistance: number
  externalField: ExternalFieldInfo
  parity: {
    insideGoodPolytope: boolean
    lambward: boolean
  }
}

export function normalizeTargets(metrics: MetricSpec[]): number[] {
  const raw = metrics.map(m => Math.max(0, m.target))
  const sum = raw.reduce((a, b) => a + b, 0)

  if (sum <= 0) {
    return [0.25, 0.25, 0.25, 0.25]
  }

  return raw.map(v => v / sum)
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

export function normalizeAffineBarycentric(raw: number[]): number[] {
  if (raw.length !== 4) throw new Error("Need 4 coordinates")
  const sum = raw.reduce((a, b) => a + b, 0)

  if (Math.abs(sum) < 1e-9) {
    return [0.25, 0.25, 0.25, 0.25]
  }

  return raw.map(v => v / sum)
}

export function normalizedMetricTargets(metrics: MetricSpec[]): MetricSpec[] {
  const targets = normalizeTargets(metrics)
  return metrics.map((m, i) => ({
    ...m,
    target: targets[i]
  }))
}

export function projectToSimplex(raw: number[]): number[] {
  const clipped = raw.map(v => Math.max(0, v))
  const sum = clipped.reduce((a, b) => a + b, 0)

  if (sum <= 1e-9) {
    return [0.25, 0.25, 0.25, 0.25]
  }

  return clipped.map(v => v / sum)
}

export function computeBoundaryDistance(
  w: number[],
  metrics: MetricSpec[]
): number {
  if (w.length !== 4 || metrics.length !== 4) {
    throw new Error("Need 4 coordinates and 4 metrics")
  }

  const targetViolation = metrics.reduce((sum, m, i) => {
    const deviation = Math.abs(w[i] - m.target)
    const excess = Math.max(0, deviation - m.tolerance)
    return sum + excess
  }, 0)

  const simplexViolation =
    w.reduce((sum, v) => sum + Math.max(0, -v), 0) +
    w.reduce((sum, v) => sum + Math.max(0, v - 1), 0)

  const sumViolation = Math.abs(w.reduce((a, b) => a + b, 0) - 1)

  return targetViolation + simplexViolation + sumViolation
}

export function computeHealthScore(
  w: number[],
  metrics: MetricSpec[]
): number {
  if (w.length !== 4 || metrics.length !== 4) {
    throw new Error("Need 4 coordinates and 4 metrics")
  }

  const normalizedViolation = metrics.reduce((sum, m, i) => {
    const deviation = Math.abs(w[i] - m.target)
    const excess = Math.max(0, deviation - m.tolerance)
    const scaled = excess / Math.max(m.tolerance, 1e-6)
    return sum + scaled
  }, 0)

  const avgViolation = normalizedViolation / metrics.length
  const score = 100 * (1 - avgViolation)

  return Math.max(0, Math.min(100, score))
}

export function analyzeExternalField(w: number[]): ExternalFieldInfo {
  const negativeAxes = w
    .map((v, i) => ({ v, i }))
    .filter(x => x.v < 0)
    .map(x => x.i)

  const excessAxes = w
    .map((v, i) => ({ v, i }))
    .filter(x => x.v > 1)
    .map(x => x.i)

  const externalMagnitude =
    w.reduce((s, v) => s + Math.max(0, -v), 0) +
    w.reduce((s, v) => s + Math.max(0, v - 1), 0)

  return {
    isExternal: negativeAxes.length > 0 || excessAxes.length > 0,
    negativeAxes,
    excessAxes,
    externalMagnitude
  }
}

export function isInsideSimplex(w: number[], eps = 1e-9): boolean {
  if (w.length !== 4) return false

  const sum = w.reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1) > eps) return false

  return w.every(v => v >= -eps && v <= 1 + eps)
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
    const min = m.target - m.tolerance;
    const max = m.target + m.tolerance;
    if (v < min - eps || v > max + eps) {
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
  config: SimplexConfig
): { x: number; distance: number } {
  const targets = normalizeTargets(config.metrics)
  const c = config.centroid ?? targets
  const d = l2(w, c)

  const vertices: number[][] = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]

  const maxDist = Math.max(...vertices.map(v => l2(v, c))) || 1
  const scale = config.lambdaScale ?? 1

  // positive near target/centroid, negative only after crossing halfway-to-vertex scale
  const normalized = 1 - d / maxDist
  const x = (2 * normalized - 1) * scale

  return { x, distance: d }
}

export function computeParityBits(
  raw: number[],
  config: SimplexConfig
): DiagnosticResult {
  const metrics = normalizedMetricTargets(config.metrics)
  const normalizedConfig = { ...config, metrics }

  const simplexW = normalizeToSimplex(raw)
  const inside = isInsideGoodPolytope(simplexW, normalizedConfig)
  const boundaryDistance = computeBoundaryDistance(simplexW, metrics)
  const healthScore = computeHealthScore(simplexW, metrics)
  const { x, distance } = computeLambdaScalar(simplexW, normalizedConfig)

  return {
    affineW: simplexW,
    simplexW,
    distanceFromCentroid: distance,
    x,
    healthScore,
    boundaryDistance,
    externalField: {
      isExternal: false,
      negativeAxes: [],
      excessAxes: [],
      externalMagnitude: 0
    },
    parity: {
      insideGoodPolytope: inside,
      lambward: x >= 0
    }
  }
}