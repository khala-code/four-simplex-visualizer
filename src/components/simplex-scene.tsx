// SimplexScene.tsx
import React, { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { SimplexConfig, DiagnosticResult } from "./simplex-core"
import { barycentric4To3, tetraVertices3D } from "./simplex-3d"

interface Props {
  config: SimplexConfig
  result: DiagnosticResult
}

// Simple helper: map metric bands to a "healthy bar" segment in 3D
function HealthyRegionMesh({ config }: { config: SimplexConfig }) {
  // crude: sample corners as before, then draw their convex hull as a thin box.
  // For a first pass we'll just draw a green box around the centroid to indicate region.
  const centroid: [number, number, number] = [0, 0, 0]

  const size: [number, number, number] = [1.2, 0.3, 0.3] // tweak by eye

  return (
    <mesh position={centroid}>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#2e7d32" wireframe opacity={0.4} transparent />
    </mesh>
  )
}

function SimplexGeometry({ config, result }: { config: SimplexConfig; result: DiagnosticResult }) {
  const vertices = tetraVertices3D

  const edges = useMemo(
    () => [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3]
    ],
    []
  )

  const { normalizedW, parity } = result
  const point = barycentric4To3(normalizedW)

  const color = parity.insideGoodPolytope
    ? parity.lambward
      ? "#ffb74d"
      : "#e53935"
    : "#64b5f6"
    
    const positions = useMemo(
    () =>
        new Float32Array(
        edges.flatMap(([i, j]) => [...vertices[i], ...vertices[j]])
        ),
    [edges, vertices]
    )

  return (
    <>
      {/* edges */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={edges.length * 2}
            itemSize={3}
            args={[positions, 3]}
            array={new Float32Array(
              edges.flatMap(([i, j]) => [...vertices[i], ...vertices[j]])
            )}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#888" linewidth={1} />
      </lineSegments>

      {/* vertices + labels (simple spheres) */}
      {vertices.map((v, i) => (
        <group key={i} position={v}>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#bbb" />
          </mesh>
          {/* optional: label via HTML overlay later */}
        </group>
      ))}

      {/* healthy region marker */}
      <HealthyRegionMesh config={config} />

      {/* current state point */}
      <mesh position={point}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  )
}

export const Simplex3D: React.FC<Props> = ({ config, result }) => {
  return (
    <Canvas
      style={{ width: 360, height: 360, background: "#000" }}
      camera={{ position: [3, 3, 3], fov: 45 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight intensity={0.8} position={[5, 5, 5]} />

      <SimplexGeometry config={config} result={result} />
      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  )
}