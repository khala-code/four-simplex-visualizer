// simplex-visual.ts

// 4 vertices in 3D (regular-ish tetrahedron)
const tetraVertices3D: [number, number, number][] = [
  [1, 1, 1],
  [-1, -1, 1],
  [-1, 1, -1],
  [1, -1, -1]
]

// Simple orthographic projection 3D -> 2D
function project3Dto2D([x, y, z]: [number, number, number]): [number, number] {
  // drop z, small skew for aesthetics
  return [x + 0.2 * z, y - 0.2 * z]
}

// Barycentric 4D -> 2D using the tetra vertices
export function barycentric4To2(w: number[]): [number, number] {
  if (w.length !== 4) throw new Error("Need 4 weights")
  let x = 0, y = 0, z = 0
  for (let i = 0; i < 4; i++) {
    x += w[i] * tetraVertices3D[i][0]
    y += w[i] * tetraVertices3D[i][1]
    z += w[i] * tetraVertices3D[i][2]
  }
  return project3Dto2D([x, y, z])
}

export interface Point2D {
  x: number
  y: number
}