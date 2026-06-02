# Four Simplex Diagnostic Tool

A small TypeScript + React diagnostic app for exploring a 4-metric state inside a simplex, evaluating whether the state is inside a configured healthy region, and visualizing the result as a rotatable 3D tetrahedral embedding of the four-simplex.

## Overview

The app models a state as four non-negative weights \(w_1..w_4\) that are normalized so that they sum to 1. This is a barycentric representation over a simplex, where each vertex corresponds to one metric axis such as H, L, M, and P.

The current implementation supports:

- Configurable axis labels.
- Per-axis healthy-region bounds using min/max values.
- Raw estimate input with automatic normalization to simplex coordinates.
- A diagnostic readout including normalized weights, distance from centroid, lamb/wolf scalar `x`, and two parity bits.
- A rotatable 3D visualization of the tetrahedral embedding using React Three Fiber.

## Conceptual Model

### State space

A state is represented by barycentric coordinates:

\[
(w_1, w_2, w_3, w_4), \quad w_i \ge 0, \quad \sum_{i=1}^{4} w_i = 1
\]

Each coordinate measures the contribution of one metric axis.

### Healthy region

The healthy region is currently approximated by per-axis lower and upper bounds:

- `metric.min <= w_i <= metric.max`
- plus the simplex constraints \(w_i \ge 0\) and \(\sum w_i = 1\)

This gives a small executable contract that is easy to tune.

### Parity bits

The diagnostic exposes two bits:

- **Bit A**: inside or outside the configured healthy region.
- **Bit B**: lamb or wolf orientation, derived from the sign of scalar `x`.

### Lamb/wolf scalar

The scalar `x` is based on distance from the centroid of the simplex and a sign convention:

- positive `x` means lamb-ward
- negative `x` means wolf-ward

This is intentionally lightweight so the parity contract remains stable even if the geometry becomes more sophisticated later.

## Project Structure

A typical layout is:

```text
src/
  App.tsx
  simplex-core.ts
  simplex-3d.ts
  Simplex3D.tsx
```

### File roles

- `App.tsx` — UI state, form inputs, diagnostic readout, top-level composition.
- `simplex-core.ts` — normalization, healthy-region check, lamb/wolf scalar, parity computation.
- `simplex-3d.ts` — barycentric-to-3D mapping using tetrahedron vertices.
- `Simplex3D.tsx` — React Three Fiber scene with tetrahedron edges, point marker, and orbit controls.

## Installation

Install dependencies:

```bash
npm install
npm install three @react-three/fiber @react-three/drei
```

If the project was created with Vite:

```bash
npm run dev
```

If the project was created with Create React App:

```bash
npm start
```

## Usage

1. Set the four axis labels and their healthy-region min/max values.
2. Enter raw estimates for the four metrics.
3. The app normalizes the values into simplex coordinates.
4. Read the diagnostic outputs:
   - normalized `w`
   - distance from centroid
   - lamb/wolf scalar `x`
   - Bit A: inside/outside
   - Bit B: lamb/wolf
5. Rotate the 3D tetrahedron to inspect the point from different viewing angles.

## Example Interpretation

Given raw estimates:

```text
H = 14
L = 15
M = 12
P = 13
```

The app converts these into normalized barycentric weights. If the resulting point lies outside the configured min/max bounds, Bit A becomes `OUTSIDE (1)`. If `x < 0`, Bit B becomes `WOLF (0)`.

This lets the app act as a compact diagnostic surface for both specification compliance and directional orientation.

## Notes on Geometry

A four-simplex naturally lives in four dimensions, but barycentric coordinates over four components can be embedded as a tetrahedron in 3D for interaction. The current visualizer uses a tetrahedral embedding so the point can be inspected with orbit controls instead of flattening everything into 2D.

This preserves more geometric intuition than a 2D projection, though it still remains a visualization of the barycentric state rather than a full direct rendering of four-dimensional space.

## Known Limitations

- No barycentric reflection implemented
- The lamb/wolf scalar uses a lightweight sign-and-distance rule rather than a full optimization or projection onto the healthy-region boundary.
- Labels and region mesh can be refined further.
- The visualizer is intended as a diagnostic aid, not a mathematically exhaustive simplex analysis environment.

## Possible Next Steps

- Implement barycentric reflection to accomodate negative values (outside the simplex - wolf field)
- Compute projection onto the healthy region and derive `x` from boundary distance.
- Add trajectories through time for repeated measurements.
- Add vertex labels in 3D using HTML overlays.
- Add presets for different domain models beyond H/L/M/P.

## Development Tips

### Common React Three Fiber issue

If TypeScript complains that `bufferAttribute` is missing `args`, use:

```tsx
<bufferAttribute attach="attributes-position" args={[positions, 3]} />
```

instead of manually passing `count`, `itemSize`, and `array` props.

### Common config issue

If the visualizer throws an error while reading `metrics`, ensure:

- `config` is always defined before rendering the visualizer.
- `config.metrics.length === 4` before mounting the 3D component.
- defensive guards exist inside `useEffect` or render logic.

## License

Add your preferred license here.
