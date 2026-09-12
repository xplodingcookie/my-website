import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SimplexSolver } from '../app/linear-programming/solver.ts';

function solve(c, constraints) {
  return new SimplexSolver(c, constraints.map(row => row.slice(0, -1)), constraints.map(row => row.at(-1))).solve();
}

test('preview example reaches (4, 2), objective 16', () => {
  const result = solve([3, 2], [[1, 0, 4], [0, 1, 4], [1, 1, 6]]);
  assert.equal(result.status, 'optimal');
  assert.deepEqual(result.steps.at(-1).sol, [4, 2]);
  assert.equal(result.steps.at(-1).obj, 16);
});
test('Phase I finds a feasible basis away from the origin', () => {
  const result = solve([3, 2], [[-1, 0, -2], [0, -1, -1], [1, 1, 6], [1, 0, 4]]);
  assert.equal(result.status, 'optimal');
  assert.deepEqual(result.steps.at(-1).sol, [4, 2]);
  assert.equal(result.steps.at(-1).obj, 16);
});
test('contradictory constraints are infeasible', () => {
  const result = solve([1, 1], [[1, 0, 1], [-1, 0, -2]]);
  assert.equal(result.status, 'infeasible');
});
test('an improving column without a leaving row is unbounded', () => {
  const result = solve([1, 1], [[-1, 0, 0], [0, -1, 0]]);
  assert.equal(result.status, 'unbounded');
});
test('empty custom constraints are unbounded for a positive objective', () => {
  assert.equal(solve([3, 2], []).status, 'unbounded');
});
test('redundant constraints and a zero objective are supported', () => {
  const result = solve([0, 0], [[0, 0, 0], [1, 1, 6], [2, 2, 12]]);
  assert.equal(result.status, 'optimal');
  assert.equal(result.steps.at(-1).obj, 0);
});
test('degenerate Phase I basis produces a feasible final answer', () => {
  const result = solve([1, 1], [[-1, -1, -2], [-2, -2, -4], [1, 1, 2]]);
  assert.equal(result.status, 'optimal');
  assert.ok(Math.abs(result.steps.at(-1).obj - 2) < 1e-8);
});
test('an iteration limit is reported as unfinished rather than optimal', () => {
  const result = new SimplexSolver([3, 2], [[1, 0], [0, 1], [1, 1]], [4, 4, 6]).solve(0);
  assert.equal(result.status, 'searching');
  assert.equal(result.steps.at(-1).optimal, false);
});
