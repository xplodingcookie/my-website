import type { Constraint, Point, Problem } from "./problem";

export type Geometry = {
  polygon: Point[];
  extent: number;
  boundaries: [Point, Point][];
};

// Normalised rows measure signed distances, so scaling an inequality does not
// change the geometric tolerances. Zero rows are handled separately below.
const EPS = 1e-7;
function normalise([a, b, c]: Constraint): Constraint {
  const scale = Math.hypot(a, b);
  return [a / scale, b / scale, c / scale];
}

// Clip the line a·x + b·y = c to the square viewing window [0, extent]², so
// every constraint is visible as a boundary even where it is not binding.
function clipBoundary(
  [a, b, c]: Constraint,
  extent: number,
): [Point, Point] | null {
  const eps = EPS;
  const candidates: Point[] = [];
  if (Math.abs(b) > eps)
    candidates.push([0, c / b], [extent, (c - a * extent) / b]);
  if (Math.abs(a) > eps)
    candidates.push([c / a, 0], [(c - b * extent) / a, extent]);
  const inside = candidates.filter(
    ([x, y]) =>
      x >= -eps && x <= extent + eps && y >= -eps && y <= extent + eps,
  );
  if (inside.length < 2) return null;
  // A line through a corner yields duplicates; keep the farthest pair.
  let best: [Point, Point] | null = null;
  let span = eps;
  for (let i = 0; i < inside.length; i++)
    for (let j = i + 1; j < inside.length; j++) {
      const d = Math.hypot(
        inside[i][0] - inside[j][0],
        inside[i][1] - inside[j][1],
      );
      if (d > span) {
        span = d;
        best = [inside[i], inside[j]];
      }
    }
  return best;
}
// Geometry depends only on the problem. Clip an explicit viewing window so an
// unbounded region is shown as a clipped region, not a falsely closed hull.
export function calculateGeometry(problem: Problem): Geometry {
  if (problem.constraints.some(([a, b, c]) => a === 0 && b === 0 && c < 0))
    return { polygon: [], extent: 5, boundaries: [] };
  const rows = problem.constraints
    .filter(([a, b]) => a !== 0 || b !== 0)
    .map(normalise);
  const constraints: Constraint[] = [
    ...rows,
    [-1, 0, 0],
    [0, -1, 0],
  ];
  const vertices: Point[] = [];
  for (let i = 0; i < constraints.length; i++)
    for (let j = i + 1; j < constraints.length; j++) {
      const [a, b, c] = constraints[i],
        [d, e, f] = constraints[j];
      const det = a * e - b * d;
      if (Math.abs(det) < 1e-10) continue;
      const x = (c * e - b * f) / det,
        y = (a * f - c * d) / det;
      if (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        constraints.every(([u, v, w]) => u * x + v * y <= w + EPS)
      )
        vertices.push([x, y]);
    }
  const extent = Math.max(5, ...vertices.flat().map((n) => n * 1.08));
  let polygon: Point[] = [
    [0, 0],
    [extent, 0],
    [extent, extent],
    [0, extent],
  ];
  for (const [a, b, c] of constraints) {
    const output: Point[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const start = polygon[i],
        end = polygon[(i + 1) % polygon.length];
      const startDistance = a * start[0] + b * start[1] - c,
        endDistance = a * end[0] + b * end[1] - c;
      // Snap near-boundary values to zero before classifying and intersecting.
      const s = Math.abs(startDistance) <= EPS ? 0 : startDistance,
        e = Math.abs(endDistance) <= EPS ? 0 : endDistance;
      if (s <= 0) output.push(start);
      if ((s <= 0) !== (e <= 0)) {
        const t = s / (s - e);
        output.push([
          start[0] + t * (end[0] - start[0]),
          start[1] + t * (end[1] - start[1]),
        ]);
      }
    }
    polygon = output;
  }
  const boundaries = rows
    .map((constraint) => clipBoundary(constraint, extent))
    .filter((segment): segment is [Point, Point] => segment !== null);
  return { polygon, extent, boundaries };
}
