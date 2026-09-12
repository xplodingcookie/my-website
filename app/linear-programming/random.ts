import {
  isFeasible,
  ORIGINAL,
  type Constraint,
  type Problem,
} from "./problem.ts";
import { calculateGeometry } from "./geometry.ts";
import { SimplexSolver } from "./solver.ts";

// A generated problem must earn its place in the walkthrough: integer data the
// editor accepts, an origin outside the region so Phase I really runs, and an
// optimal walk long enough to watch.
function isInteresting(problem: Problem): boolean {
  const vertices = calculateGeometry(problem).polygon;
  if (vertices.length < 5) return false;
  const inside: [number, number] = [
    vertices.reduce((s, p) => s + p[0], 0) / vertices.length,
    vertices.reduce((s, p) => s + p[1], 0) / vertices.length,
  ];
  if (!isFeasible(problem, inside)) return false;
  if (isFeasible(problem, [0, 0])) return false;
  if (
    problem.constraints
      .flat()
      .concat(problem.objective)
      .some((n) => !Number.isInteger(n) || Math.abs(n) > 1e6)
  )
    return false;
  const result = new SimplexSolver(
    problem.objective,
    problem.constraints.map((row) => [row[0], row[1]]),
    problem.constraints.map((row) => row[2]),
  ).solve();
  return result.status === "optimal" && result.steps.length >= 4;
}

// The original playground's generator: a skewed, sheared n-gon translated off
// the origin, each edge turned into an inequality via its centroid-facing
// normal, with a small perturbation so vertices stay non-degenerate.
function generate(rng: () => number): Problem | null {
  const n = 9 + Math.floor(rng() * 4);
  const baseRadius = 15 + rng() * 15;
  const skewFactor = 0.3 + rng() * 0.4;
  const angles = Array.from(
    { length: n },
    (_, i) => (i * 2 * Math.PI) / n + (rng() - 0.5) * skewFactor,
  ).sort((a, b) => a - b);
  const shearX = (rng() - 0.5) * 0.3;
  const shearY = (rng() - 0.5) * 0.3;
  const raw = angles.map((angle) => {
    const radius = baseRadius * (0.7 + rng() * 0.6);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return [x + shearY * y, y + shearX * x];
  });
  const pad = 5;
  const dx = Math.max(0, -Math.min(...raw.map((p) => p[0]))) + pad;
  const dy = Math.max(0, -Math.min(...raw.map((p) => p[1]))) + pad;
  const verts = raw.map(([x, y]) => [Math.round(x + dx), Math.round(y + dy)]);
  const cx = verts.reduce((s, p) => s + p[0], 0) / n;
  const cy = verts.reduce((s, p) => s + p[1], 0) / n;
  const constraints: Constraint[] = [];
  for (let i = 0; i < n; i++) {
    const [x1, y1] = verts[i];
    const [x2, y2] = verts[(i + 1) % n];
    const nx = y2 - y1;
    const ny = -(x2 - x1);
    if (nx === 0 && ny === 0) continue;
    const sign = nx * cx + ny * cy < nx * x1 + ny * y1 ? 1 : -1;
    const c = sign * (nx * x1 + ny * y1) + Math.round((rng() - 0.5) * 2);
    constraints.push([sign * nx, sign * ny, c]);
  }
  const problem: Problem = {
    objective: [
      1 + Math.floor(rng() * 5),
      1 + Math.floor(rng() * 5),
    ] as Problem["objective"],
    constraints,
  };
  return isInteresting(problem) ? problem : null;
}

export function randomProblem(rng: () => number = Math.random): Problem {
  for (let attempt = 0; attempt < 24; attempt++) {
    const problem = generate(rng);
    if (problem) return problem;
  }
  // Every attempt rejected: fall back to the verified original region.
  return ORIGINAL;
}
