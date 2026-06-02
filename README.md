# Four Simplex

A small interactive demo for exploring how a four-factor balance sits inside or outside a healthy region.

## What it does

This app takes four raw estimates, normalizes them into simplex coordinates, plots the result in a tetrahedral view, and reports whether the point sits inside the configured healthy polytope.

It also generates a short plain-language summary so someone can understand the result without reading the raw coordinates.

## How to read it

- **Normalized w** shows the four normalized shares.
- **Distance from centroid** shows how far the point is from the balanced center.
- **x (lamb/wolf scalar)** is an orientation-style scalar used by the demo.
- **Bit A** reports whether the point is inside the configured healthy region.
- **Bit B** reports the current orientation state.
- **Summary** explains the strongest driver of the result in plain language.

## Healthy region

Each axis has:

- a label
- a target share
- a tolerance band

A point is treated as healthy when all four normalized coordinates remain within their configured target bands.

## Scope

This version is intentionally simple.

- It is a simplex-only introductory demo.
- Raw inputs are non-negative.
- The app focuses on share, balance, drift, and readable diagnostics.
- It does not currently model signed coordinates or an external affine field.

## Usage

1. Set the axis labels, targets, and tolerances.
2. Enter four raw estimates.
3. Read the normalized point, diagnostic flags, and summary.
4. Adjust values to see how the point moves relative to the healthy region.

## Why this exists

The point of the demo is to make a four-way tradeoff visible.

Instead of only showing raw numbers, it lets someone see:

- the shape of the balance
- whether the current state is still in range
- which factor is pushing the point out of range

## Next ideas

- Custom presets for named schemas
- Saved snapshots and trajectories
- Better explanation strings for max/min band crossings
- UI polish for labels and status states