// SimplexScene.tsx
import React, { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { SimplexConfig, DiagnosticResult } from "./simplex-core"
import { barycentric4To3, tetraVertices3D } from "./simplex-3d"
import { HealthyRegionMesh, TargetPoint } from "./simplex-3d.tsx"
import { Html } from "@react-three/drei"

interface Props {
  config: SimplexConfig
  result: DiagnosticResult
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

  const { affineW, parity } = result
  const point = barycentric4To3(affineW)

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
            <Html distanceFactor={8} occlude>
            <div
                style={{
                color: "#ddd",
                fontSize: "12px",
                whiteSpace: "nowrap",
                background: "rgba(0,0,0,0.65)",
                padding: "2px 6px",
                borderRadius: "6px"
                }}
            >
                {config.metrics[i]?.name ?? `m${i + 1}`}
            </div>
            </Html>
        </group>
      ))}

      {/* healthy region marker */}
      <HealthyRegionMesh config={config} />
      <TargetPoint config={config} />

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