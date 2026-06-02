// Simplex3D.tsx
import React, { useMemo } from "react"
import * as THREE from "three"
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js"
import { healthyRegionPoints3D } from "./healthy-region"
import { SimplexConfig } from "./simplex-core"
import { barycentric4To3 } from "./simplex-3d"
import { MetricSpec } from "./simplex-core"

export function normalizeTargets(metrics: MetricSpec[]): number[] {
  const raw = metrics.map(m => Math.max(0, m.target))
  const sum = raw.reduce((a, b) => a + b, 0)

  if (sum <= 0) {
    return [0.25, 0.25, 0.25, 0.25]
  }

  return raw.map(v => v / sum)
}

export function isValidTargetConfig(metrics: MetricSpec[]): boolean {
  if (metrics.length !== 4) return false

  const normalizedTargets = normalizeTargets(metrics)
  const sum = normalizedTargets.reduce((a, b) => a + b, 0)
  const eps = 1e-6

  return (
    Math.abs(sum - 1) < eps &&
    normalizedTargets.every(t => t >= 0) &&
    metrics.every(m => m.tolerance >= 0)
  )
}

export function HealthyRegionMesh({ config }: { config: SimplexConfig }) {
  const points = useMemo(
    () => healthyRegionPoints3D(config.metrics, 24),
    [config]
  )

  const geometry = useMemo(() => {
    if (points.length < 4) return null
    return new ConvexGeometry(points)
  }, [points])

  if (!geometry) return null
  if (!isValidTargetConfig(config.metrics)) return null

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#2e7d32"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#2e7d32"
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  )
}

export function TargetPoint({ config }: { config: SimplexConfig }) {
  const target = config.metrics.map(m => m.target)
  const [x, y, z] = barycentric4To3(target)

  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color="#66bb6a" />
    </mesh>
  )
}