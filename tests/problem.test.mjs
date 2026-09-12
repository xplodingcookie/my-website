import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SIMPLE,
  EXAMPLES,
  numberError,
  toDraft,
  validateDraft,
  isFeasible,
} from "../app/linear-programming/problem.ts";
import { calculateGeometry } from "../app/linear-programming/geometry.ts";
import { SimplexSolver } from "../app/linear-programming/solver.ts";

test("draft validation rejects partial, missing, nonfinite and unsupported tiny values without mutating input", () => {
  for (const raw of [
    "",
    " ",
    "2oops",
    "1,2",
    "-",
    "Infinity",
    "NaN",
    "1e999",
    "1e-999",
    "0.00000001",
    "0x10",
  ]) {
    const draft = toDraft(SIMPLE);
    draft.objective[0] = raw;
    const result = validateDraft(draft);
    assert.equal(result.problem, null, raw);
    assert(result.errors["objective-0"]);
    assert.equal(draft.objective[0], raw);
  }
});
test("negative, decimal and scientific notation are parsed as complete numbers", () => {
  for (const raw of [
    "0",
    "-0",
    "-2",
    ".5",
    "1.",
    "1e3",
    " -2.5 ",
    "0e-999",
    "1e-6",
  ])
    assert.equal(numberError(raw), null, raw);
  const draft = toDraft(SIMPLE);
  draft.constraints[0][0] = "";
  assert.equal(validateDraft(draft).problem, null);
  draft.constraints[0][0] = "-2.5";
  assert.equal(validateDraft(draft).problem.constraints[0][0], -2.5);
});
test("simple feasible polygon has exact vertices and correct bounds", () => {
  const geometry = calculateGeometry(SIMPLE);
  assert.equal(geometry.polygon.length, 5);
  assert(geometry.polygon.some((p) => p[0] === 4 && p[1] === 2));
  assert(geometry.polygon.every((p) => isFeasible(SIMPLE, p)));
});
test("positive row scaling preserves the feasible polygon and plotted boundaries", () => {
  const problem = {
    objective: [1, 1],
    constraints: [[1, 0, 20], [-1, 0, -10], [0, 1, 20], [0, -1, -10]],
  };
  const expected = calculateGeometry(problem);
  for (const scales of [[1e-6, 1e-6, 1e-6, 1e-6], [1e4, 1e-6, 0.5, 2]]) {
    const scaled = {
      ...problem,
      constraints: problem.constraints.map((row, i) => row.map(n => n * scales[i])),
    };
    assert(validateDraft(toDraft(scaled)).problem);
    const actual = calculateGeometry(scaled);
    assert.equal(actual.polygon.length, 4);
    assert.equal(actual.boundaries.length, 4);
    assert(Math.abs(actual.extent - expected.extent) < 1e-7);
    for (const vertex of expected.polygon)
      assert(actual.polygon.some(p => Math.hypot(p[0] - vertex[0], p[1] - vertex[1]) < 1e-7));
    for (const [i, boundary] of expected.boundaries.entries())
      for (const [j, point] of boundary.entries())
        assert(Math.hypot(actual.boundaries[i][j][0] - point[0], actual.boundaries[i][j][1] - point[1]) < 1e-7);
  }
});
test("zero-coefficient rows are redundant or impossible without producing NaN geometry", () => {
  for (const limit of [0, 1e-6, 1e6])
    assert.deepEqual(
      calculateGeometry({ ...SIMPLE, constraints: [...SIMPLE.constraints, [0, 0, limit]] }),
      calculateGeometry(SIMPLE),
    );
  assert.deepEqual(
    calculateGeometry({ ...SIMPLE, constraints: [[0, 0, -1e-6]] }),
    { polygon: [], extent: 5, boundaries: [] },
  );
});
const example = (name) => EXAMPLES.find((item) => item.name === name).problem;

test("infeasible regions are empty, unbounded regions reach the viewing boundary", () => {
  assert.equal(
    calculateGeometry(example("No feasible solution")).polygon.length,
    0,
  );
  const g = calculateGeometry(example("An unbounded objective"));
  assert(g.polygon.some((p) => p[0] === g.extent));
});
test("phase metadata distinguishes feasibility work from original-objective optimisation", () => {
  const p = example("Find a feasible start");
  const result = new SimplexSolver(
    p.objective,
    p.constraints.map((r) => r.slice(0, 2)),
    p.constraints.map((r) => r[2]),
  ).solve();
  assert.equal(result.steps[0].phase, "feasibility");
  assert(
    result.steps.some(
      (s) => s.phase === "feasibility" && !isFeasible(p, s.sol),
    ),
  );
  assert(
    result.steps
      .filter((s) => s.phase === "optimisation")
      .every((s) => isFeasible(p, s.sol)),
  );
  assert.deepEqual(result.steps.at(-1).sol, [4, 2]);
});
