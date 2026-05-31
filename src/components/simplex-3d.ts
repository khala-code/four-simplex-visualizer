// simplex-3d.ts
export type Vec3 = [number, number, number]

// Regular-ish tetrahedron vertices in R^3 (Four-simplex boundary).[web:29]
export const tetraVertices3D: Vec3[] = [
  [1, 1, 1],    // H
  [-1, -1, 1],  // L
  [-1, 1, -1],  // M
  [1, -1, -1]   // P
]

// Barycentric [w1..w4] -> 3D point
export function barycentric4To3(w: number[]): Vec3 {
  if (w.length !== 4) throw new Error("Need 4 weights")
  let x = 0, y = 0, z = 0
  for (let i = 0; i < 4; i++) {
    x += w[i] * tetraVertices3D[i][0]
    y += w[i] * tetraVertices3D[i][1]
    z += w[i] * tetraVertices3D[i][2]
  }
  return [x, y, z]
}