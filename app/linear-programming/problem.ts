export type Point = [number, number];
export type Constraint = [number, number, number];
export type Problem = { objective: Point; constraints: Constraint[] };
export type Draft = { objective: string[]; constraints: string[][] };
export const SIMPLE: Problem = {
  objective: [3, 2],
  constraints: [
    [1, 0, 4],
    [0, 1, 4],
    [1, 1, 6],
  ],
};
// The twenty-five-constraint region this playground launched with. The origin
// is infeasible, so Phase I has to hunt for a corner before Phase II climbs.
export const ORIGINAL: Problem = {
  objective: [3, 2],
  constraints: [
    [9, 10, 899],
    [7, -7, 63],
    [3, 3, 327],
    [0, 8, 425],
    [-2, 4, 116],
    [8, 2, 453],
    [2, 17, 1087],
    [-10, 3, -67],
    [1, 8, 431],
    [3, 6, 354],
    [-5, -2, -151],
    [-12, 4, 81],
    [-4, -8, -328],
    [-8, 3, -9],
    [2, -6, -133],
    [-4, -19, -475],
    [-4, 2, -56],
    [-7, -4, -218],
    [-2, -11, -152],
    [-2, -7, -124],
    [13, 2, 581],
    [-4, -18, -493],
    [-4, -5, -311],
    [15, -10, 645],
    [1, 3, 163],
  ],
};
export const EXAMPLES: { name: string; note: string; problem: Problem }[] = [
  {
    name: "The preview example",
    note: "Start at (0, 0), move to (4, 0), then (4, 2).",
    problem: SIMPLE,
  },
  {
    name: "The original polygon",
    note: "Twenty-five constraints, and an infeasible origin: Phase I finds a corner, Phase II climbs the boundary.",
    problem: ORIGINAL,
  },
  {
    name: "Find a feasible start",
    note: "The origin breaks x₁ ≥ 2 and x₂ ≥ 1. Phase I finds a feasible basis before optimising.",
    problem: {
      objective: [3, 2],
      constraints: [
        [-1, 0, -2],
        [0, -1, -1],
        [1, 0, 4],
        [1, 1, 6],
      ],
    },
  },
  {
    name: "More edges",
    note: "Several boundaries compete to limit an improving move.",
    problem: {
      objective: [2, 3],
      constraints: [
        [1, 0, 8],
        [0, 1, 8],
        [1, 1, 12],
        [2, 1, 19],
        [1, 2, 20],
      ],
    },
  },
  {
    name: "No feasible solution",
    note: "x₁ cannot be both at most 1 and at least 2.",
    problem: {
      objective: [3, 2],
      constraints: [
        [1, 0, 1],
        [-1, 0, -2],
      ],
    },
  },
  {
    name: "An unbounded objective",
    note: "There is no upper limit on x₁, so the objective can keep growing.",
    problem: { objective: [3, 2], constraints: [[0, 1, 4]] },
  },
];
export const toDraft = (problem: Problem): Draft => ({
  objective: problem.objective.map(String),
  constraints: problem.constraints.map((row) => row.map(String)),
});
// Whole-string parsing: neither blank values nor partial numbers can be committed.
export function numberError(raw: string): string | null {
  if (!raw.trim()) return "Enter a number; use 0 for a zero coefficient.";
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()))
    return "Enter a complete number, such as -2, 0.5, or 1e3.";
  const value = Number(raw);
  if (!Number.isFinite(value) || Math.abs(value) > 1e6)
    return "Use a finite number between −1,000,000 and 1,000,000.";
  if (
    (value === 0 && /[1-9]/.test(raw.split(/[eE]/)[0])) ||
    (value !== 0 && Math.abs(value) < 1e-6)
  )
    return "Use 0 or a magnitude of at least 0.000001 for this floating-point solver.";
  return null;
}
export function validateDraft(draft: Draft): {
  problem: Problem | null;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  draft.objective.forEach((value, i) => {
    const error = numberError(value);
    if (error) errors[`objective-${i}`] = error;
  });
  draft.constraints.forEach((row, i) =>
    row.forEach((value, j) => {
      const error = numberError(value);
      if (error) errors[`constraint-${i}-${j}`] = error;
    }),
  );
  return {
    errors,
    problem: Object.keys(errors).length
      ? null
      : {
          objective: draft.objective.map(Number) as Point,
          constraints: draft.constraints.map(
            (row) => row.map(Number) as Constraint,
          ),
        },
  };
}
export const format = (n: number) =>
  Math.abs(n) < 1e-8 ? "0" : Number(n.toPrecision(5)).toString();
export const objectiveAt = (problem: Problem, point: number[]) =>
  problem.objective[0] * point[0] + problem.objective[1] * point[1];
export const isFeasible = (problem: Problem, point: number[]) =>
  point.every((n) => n >= -1e-7) &&
  problem.constraints.every(
    ([a, b, c]) => a * point[0] + b * point[1] <= c + 1e-7,
  );
