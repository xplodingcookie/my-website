import { test } from "node:test";
import assert from "node:assert/strict";
import { randomProblem } from "../app/linear-programming/random.ts";
import { isFeasible, ORIGINAL } from "../app/linear-programming/problem.ts";
import { calculateGeometry } from "../app/linear-programming/geometry.ts";
import { SimplexSolver } from "../app/linear-programming/solver.ts";

function solve(problem) {
  return new SimplexSolver(
    problem.objective,
    problem.constraints.map((row) => row.slice(0, 2)),
    problem.constraints.map((row) => row[2]),
  ).solve();
}

function assertInteresting(problem, label) {
  for (const n of [...problem.objective, ...problem.constraints.flat()]) {
    assert(Number.isInteger(n), `${label}: integer coefficients only`);
    assert(Math.abs(n) <= 1e6, `${label}: within the editor's numeric range`);
  }
  assert(
    !isFeasible(problem, [0, 0]),
    `${label}: origin infeasible, so Phase I runs`,
  );
  const geometry = calculateGeometry(problem);
  assert(geometry.polygon.length >= 5, `${label}: a many-sided region`);
  assert(
    geometry.boundaries.length >= 5,
    `${label}: plenty of constraint boundaries cross the viewing window`,
  );
  const result = solve(problem);
  assert.equal(result.status, "optimal", `${label}: bounded and feasible`);
  assert(result.steps.length >= 4, `${label}: a walk long enough to watch`);
}

test("forty random problems are integer, off-origin, many-sided, and solvable", () => {
  for (let i = 0; i < 40; i++) assertInteresting(randomProblem(), `run ${i}`);
});

test("the original polygon — the default and the generator's fallback — satisfies the same contract", () => {
  assertInteresting(ORIGINAL, "original");
});

test("a hostile RNG still returns a usable problem", () => {
  // Constant RNG produces degenerate polygons; every attempt is rejected and
  // the fallback must be returned rather than an invalid problem.
  const problem = randomProblem(() => 0.5);
  assertInteresting(problem, "hostile rng");
});

test("boundary segments lie on their constraint lines within the window", () => {
  const problem = randomProblem();
  const { boundaries, extent } = calculateGeometry(problem);
  for (const [from, to] of boundaries)
    for (const [x, y] of [from, to]) {
      assert(x >= -1e-6 && x <= extent + 1e-6);
      assert(y >= -1e-6 && y <= extent + 1e-6);
      const on = problem.constraints.some(
        ([a, b, c]) => Math.abs(a * x + b * y - c) < 1e-6 * Math.max(1, Math.abs(c)),
      );
      assert(on, "segment endpoint sits on a constraint boundary");
    }
});
