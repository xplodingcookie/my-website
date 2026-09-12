"use client";
import { memo, useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";
import useReducedMotion from "./useReducedMotion";
import type { Geometry } from "../linear-programming/geometry";
import { format, type Point } from "../linear-programming/problem";
import { travelPlan } from "../linear-programming/travel";

type Props = {
  geometry: Geometry;
  point: number[];
  candidate?: number[];
  path: number[][];
  description: string;
  feasible: boolean;
};
function FeasibleGraph({
  geometry,
  point,
  candidate,
  path,
  description,
  feasible,
}: Props) {
  const reduced = useReducedMotion();
  // Keep geometry in one fixed coordinate system. Only the browser scales it;
  // labels use the outer SVG's native pixels and never shrink with the plot.
  const size = 320;
  const id = useId().replace(/:/g, "");
  const pad = 50,
    unit = (size - pad * 2) / geometry.extent;
  const project = (p: number[]): Point => [
    pad + p[0] * unit,
    size - pad - p[1] * unit,
  ];
  const coords = (pts: number[][]) =>
    pts.map((p) => project(p).join(",")).join(" ");
  const [px, py] = project(point);
  const [cx, cy] = candidate ? project(candidate) : [0, 0];
  // The next-vertex guide keeps clear of both endpoints: the connector starts
  // outside the current dot's halo and its arrowhead stops short of the ring.
  // A short move gets no connector at all — just the ring — and a move too
  // small to distinguish from the current point shows nothing.
  const guideLength = Math.hypot(cx - px, cy - py);
  const guideFrom = 15;
  const guideTo = guideLength - 11;
  const showCandidate = !!candidate && guideLength >= 8;
  const showConnector = guideTo - guideFrom >= 12;
  const [ux, uy] =
    guideLength > 0 ? [(cx - px) / guideLength, (cy - py) / guideLength] : [0, 0];
  // The marker walks the pivot's real route: every traversed edge in sequence
  // at a brisk pace, with the trail drawing on beneath it — single steps ease
  // into their vertex, longer runs cruise at constant speed. Backward moves,
  // problem changes, and reduced motion reposition instantly. The route is
  // computed once per step (keyed), so re-renders never restart a run.
  const pts = path.map(project);
  const pathKey = `${reduced}:${pts.length}:${px}:${py}`;
  const animRef = useRef<{
    key: string;
    geometry: Geometry;
    pts: Point[];
    travel: {
      x: number[];
      y: number[];
      drawn: number[];
      times: number[];
      duration: number;
      ease: "linear" | "easeInOut";
    } | null;
  } | null>(null);
  if (
    animRef.current?.key !== pathKey ||
    animRef.current?.geometry !== geometry
  ) {
    const prev = animRef.current;
    let travel = null;
    if (
      !reduced &&
      prev &&
      prev.geometry === geometry &&
      pts.length > prev.pts.length
    ) {
      const waypoints = [
        prev.pts[prev.pts.length - 1],
        ...pts.slice(prev.pts.length),
      ];
      const plan = travelPlan(waypoints);
      let full = 0;
      for (let i = 1; i < pts.length; i++)
        full += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (plan && full > 1e-6)
        travel = {
          x: waypoints.map((p) => p[0]),
          y: waypoints.map((p) => p[1]),
          drawn: plan.times.map(
            (t) => (full - plan.total + t * plan.total) / full,
          ),
          times: plan.times,
          duration: plan.duration,
          ease: plan.ease,
        };
    }
    animRef.current = { key: pathKey, geometry, pts, travel };
  }
  const travel = animRef.current.travel;
  const stride = travel
    ? { duration: travel.duration, times: travel.times, ease: travel.ease }
    : { duration: 0 };
  const hydrated = useRef(false);
  useEffect(() => {
    hydrated.current = true;
  }, []);
  const magnitude = 10 ** Math.floor(Math.log10(geometry.extent / 4));
  const tickStep =
    [1, 2, 5, 10]
      .map((n) => n * magnitude)
      .find((n) => n >= geometry.extent / 6) ?? magnitude;
  // Graph-paper cells stay readable at any zoom: at least 14px on the plot's
  // own scale, never finer than whole units.
  const minGrid = 14 / unit;
  const gridMagnitude = 10 ** Math.floor(Math.log10(Math.max(minGrid, 0.1)));
  const gridStep = Math.max(
    1,
    [1, 2, 5, 10]
      .map((n) => n * gridMagnitude)
      .find((n) => n >= minGrid) ?? gridMagnitude,
  );
  const ticks = Array.from(
    { length: Math.floor(geometry.extent / tickStep) + 1 },
    (_, i) => i * tickStep,
  );
  const tickLabel = (n: number) =>
    Math.abs(n) >= 10000 ? n.toExponential(0).replace("e+", "e") : format(n);
  return (
    <svg
      className="feasible-graph"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
    >
      <title id={`${id}-title`}>Feasible region and Simplex path</title>
      <desc id={`${id}-desc`}>{description}</desc>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`${id}-grid`}
            width={gridStep * unit}
            height={gridStep * unit}
            patternUnits="userSpaceOnUse"
            x={pad}
            y={size - pad}
          >
            <path
              d={`M${gridStep * unit} 0H0V${gridStep * unit}`}
              fill="none"
              stroke="#7c6d9718"
            />
          </pattern>
          <marker
            id={`${id}-arrow`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0 0L6 3L0 6" fill="none" stroke="#6950a9" />
          </marker>
        </defs>
        <rect
          x={pad}
          y={pad}
          width={size - 2 * pad}
          height={size - 2 * pad}
          fill={`url(#${id}-grid)`}
        />
        <path
          d={`M${pad} ${pad - 12}V${size - pad}H${size - pad + 12}`}
          fill="none"
          stroke="#8e829f"
        />
        {geometry.boundaries.map(([from, to], i) => {
          const [x1, y1] = project(from);
          const [x2, y2] = project(to);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#7c6d97"
              strokeOpacity=".35"
              strokeDasharray="4 6"
            />
          );
        })}
        {geometry.polygon.length > 0 && (
          <polygon
            points={coords(geometry.polygon)}
            fill="#b5a2dd40"
            stroke="#8267c5"
            strokeWidth="1.5"
          />
        )}

        <motion.polyline
          points={coords(path)}
          fill="none"
          stroke="#6950a9"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: travel ? travel.drawn : 1 }}
          transition={stride}
        />
        {showCandidate && (
          <motion.g
            key={`cand-${pts.length}`}
            initial={hydrated.current ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { delay: travel ? travel.duration : 0, duration: 0.2 }
            }
          >
            {showConnector && (
              <path
                d={`M${px + ux * guideFrom} ${py + uy * guideFrom}L${px + ux * guideTo} ${py + uy * guideTo}`}
                fill="none"
                stroke="#6950a9"
                strokeDasharray="5 5"
                strokeWidth="1.5"
                markerEnd={`url(#${id}-arrow)`}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill="#faf8ff"
              stroke="#6950a9"
              strokeWidth="1.5"
            />
          </motion.g>
        )}
        {/* Feasible points wear the accent purple; a Phase I point still
            hunting for the region wears the palette's searching sky-blue. */}
        <motion.circle
          initial={false}
          animate={travel ? { cx: travel.x, cy: travel.y } : { cx: px, cy: py }}
          transition={stride}
          r="11"
          fill={feasible ? "#6950a920" : "#4d7fbe24"}
        />
        <motion.circle
          initial={false}
          animate={travel ? { cx: travel.x, cy: travel.y } : { cx: px, cy: py }}
          transition={stride}
          r="5"
          fill={feasible ? "#6950a9" : "#4d7fbe"}
          stroke="#fff"
          strokeWidth="2"
        />
      </svg>
      <g fill="#62516f" fontSize="13" fontFamily="var(--font-mono)">
        {ticks.map((n, i) => (
          <g key={i}>
            <text
              x={`${((pad + n * unit) / size) * 100}%`}
              y={`${((size - pad + 22) / size) * 100}%`}
              textAnchor="middle"
            >
              {tickLabel(n)}
            </text>
            {i > 0 && (
              <text
                x={`${((pad - 8) / size) * 100}%`}
                y={`${((size - pad - n * unit + 4) / size) * 100}%`}
                textAnchor="end"
              >
                {tickLabel(n)}
              </text>
            )}
          </g>
        ))}
        <text
          x={`${((size - pad + 18) / size) * 100}%`}
          y={`${((size - pad + 5) / size) * 100}%`}
        >
          x₁
        </text>
        <text
          x={`${((pad - 7) / size) * 100}%`}
          y={`${((pad - 18) / size) * 100}%`}
        >
          x₂
        </text>
      </g>
    </svg>
  );
}
export default memo(FeasibleGraph);
