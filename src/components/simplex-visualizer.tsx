import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { SimplexConfig, DiagnosticResult } from "./simplex-core"
import { barycentric4To2 } from "./simplex-visual"

interface Props {
  config: SimplexConfig
  result: DiagnosticResult
  width?: number
  height?: number
}

export const SimplexVisualizer: React.FC<Props> = ({
  config,
  result,
  width = 320,
  height = 320
}) => {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const svg = d3.select(ref.current)
    svg.selectAll("*").remove()

    const padding = 24

    // 1) Base simplex: 4 canonical vertices in barycentric coords
    const baryVerts: number[][] = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]

    const verts2D = baryVerts.map(barycentric4To2)
    const xs = verts2D.map(p => p[0])
    const ys = verts2D.map(p => p[1])

    const xScale = d3
      .scaleLinear()
      .domain([d3.min(xs) ?? -1, d3.max(xs) ?? 1])
      .range([padding, width - padding])

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(ys) ?? -1, d3.max(ys) ?? 1])
      .range([height - padding, padding])

    const toPixel = (p: [number, number]) => ({
      x: xScale(p[0]),
      y: yScale(p[1])
    })

    const vertexPixels = verts2D.map(toPixel)

    // 2) Draw simplex outline (tetra projected as 4-cycle hull)
    const hullPath = d3
      .line<{ x: number; y: number }>()
      .x((d:{ x: number; y: number }) => d.x)
      .y((d:{ x: number; y: number }) => d.y)
      .curve(d3.curveLinearClosed)

    svg
      .append("path")
      .datum(vertexPixels)
      .attr("d", hullPath)
      .attr("fill", "#111")
      .attr("stroke", "#666")
      .attr("stroke-width", 1.5)

    // 3) Healthy region approximation:
    // use per-metric min/max bands to generate 2^4 corner samples,
    // then project and draw their convex hull.
    const regionSamples: number[][] = []
    for (let mask = 0; mask < 16; mask++) {
      const w = [0, 0, 0, 0]
      for (let i = 0; i < 4; i++) {
        const m = config.metrics[i]
        const val = (mask & (1 << i)) 
            ? m.target+m.tolerance
            : m.target-m.tolerance
        w[i] = Math.max(0, val)
      }
      const sum = w.reduce((a, b) => a + b, 0) || 1
      const norm = w.map(v => v / sum)
      regionSamples.push(norm)
    }

    const region2D = regionSamples.map(barycentric4To2).map(toPixel)

    const regionHull = d3.polygonHull(region2D.map(p => [p.x, p.y]))
    if (regionHull) {
      svg
        .append("path")
        .attr(
          "d",
          d3
            .line<[number, number]>()
            .x((d:number[]) => d[0])
            .y((d:number[]) => d[1])
            .curve(d3.curveLinearClosed)(regionHull)!
        )
        .attr("fill", "#2e7d3233")
        .attr("stroke", "#2e7d32")
        .attr("stroke-dasharray", "4,2")
        .attr("stroke-width", 1)
    }

    // 4) Draw current point
    const { affineW, parity } = result
    const point2D = toPixel(barycentric4To2(affineW))

    const color = parity.insideGoodPolytope
      ? parity.lambward
        ? "#ffb74d" // outside but lamb-ward
        : "#e53935" // outside wolf
      : "#64b5f6" // inside

    svg
      .append("circle")
      .attr("cx", point2D.x)
      .attr("cy", point2D.y)
      .attr("r", 6)
      .attr("fill", color)
      .attr("stroke", "#000")
      .attr("stroke-width", 1)

    // 5) Vertex labels
    vertexPixels.forEach((p, i) => {
      const label = config.metrics[i]?.name ?? `m${i + 1}`
      svg
        .append("text")
        .attr("x", p.x)
        .attr("y", p.y)
        .attr("dx", 6)
        .attr("dy", -4)
        .attr("fill", "#ccc")
        .attr("font-size", 11)
        .text(label)
    })
  }, [config, result, width, height])

  return <svg ref={ref} width={width} height={height} />
}