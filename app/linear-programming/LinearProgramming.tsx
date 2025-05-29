'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './LinearProgramming.module.css';

/****************
 * Simplex core *
 ****************/
class SimplexSolver {
  private c: number[];         // objective coefficients (length = n)
  private A: number[][];       // constraint matrix   (m × n)
  private b: number[];         // RHS column          (length = m)
  private m: number;           // #constraints
  private n: number;           // #decision variables
  private tableau: number[][] = [];  // (m+1) × (n+m+1) simplex tableau
  private basicVars: number[] = [];  // indices of current basic variables

  constructor(c: number[], A: number[][], b: number[]) {
    this.c = c;
    this.A = A;
    this.b = b;
    this.m = A.length;
    this.n = c.length;
    this.buildTableau();
  }

  /**
   * Build phase‑II tableau.  Any row with a negative RHS is flipped so that the
   * all‑slack solution is a valid starting BFS.
  */
  private buildTableau() {
    // constraints rows
    for (let i = 0; i < this.m; i++) {
      let rowA = [...this.A[i]];
      let rhs  =  this.b[i];
      if (rhs < 0) {                      // flip row if RHS is negative for feasible solution
        rowA = rowA.map(v => -v);
        rhs  = -rhs;
      }
      const row = [...this.A[i]];
      for (let j = 0; j < this.m; j++) row.push(i === j ? 1 : 0); // slack vars
      row.push(this.b[i]);
      this.tableau.push(row);
      this.basicVars.push(this.n + i);
    }
    // objective row
    const obj = this.c.map((v) => -v);
    obj.push(...Array(this.m).fill(0), 0);
    this.tableau.push(obj);
  }

  private solution(): number[] {
    const x = Array(this.n + this.m).fill(0);
    for (let i = 0; i < this.m; i++) x[this.basicVars[i]] = this.tableau[i].at(-1)!;
    return x.slice(0, this.n);
  }

  private objective(): number {
    return this.tableau.at(-1)!.at(-1)!;
  }

  private entering(): number {
    const obj = this.tableau.at(-1)!;
    let e = -1,
      min = 0;
    for (let j = 0; j < obj.length - 1; j++) if (obj[j] < min) [min, e] = [obj[j], j];
    return e;
  }

  private leaving(e: number): number {
    let l = -1,
      best = Infinity;
    for (let i = 0; i < this.m; i++) {
      const a = this.tableau[i][e];
      const b = this.tableau[i].at(-1)!;
      if (a > 1e-10) {
        const r = b / a;
        if (r < best) [best, l] = [r, i];
      }
    }
    return l;
  }

  private pivot(e: number, l: number) {
    const piv = this.tableau[l][e];
    this.tableau[l] = this.tableau[l].map((v) => v / piv);
    for (let i = 0; i < this.tableau.length; i++) {
      if (i === l) continue;
      const m = this.tableau[i][e];
      this.tableau[i] = this.tableau[i].map((v, j) => v - m * this.tableau[l][j]);
    }
    this.basicVars[l] = e;
  }

  private optimal() {
    return this.tableau.at(-1)!.slice(0, -1).every((v) => v >= -1e-10);
  }

  solve(max = 1000) {
    const steps: { sol: number[]; obj: number; optimal: boolean }[] = [];
    let k = 0;
    while (!this.optimal() && k < max) {
      const e = this.entering();
      if (e === -1) break
      const l = this.leaving(e);
      if (l === -1) {
        steps.push({ sol: this.solution(), obj: this.objective(), optimal: false });
        return steps;
      }
      this.pivot(e, l);
      steps.push({ sol: this.solution(), obj: this.objective(), optimal: false });
      k++;
    }
    steps.push({ sol: this.solution(), obj: this.objective(), optimal: this.optimal() });
    return steps;
  }
}

/**
 * Returns the vertices of the bounded feasible region
 * as an array  [[x, y], ...]  sorted counter-clockwise.
 * Works for 2-D problems with only ≤-type constraints.
 */
function hullFromConstraints(cons: number[][]): number[][] {
  // ---- 1. collect every pair-wise intersection --------------
  const pts: number[][] = [];
  for (let i = 0; i < cons.length; i++) {
    for (let j = i + 1; j < cons.length; j++) {
      const [a1, b1, c1] = cons[i];
      const [a2, b2, c2] = cons[j];
      const D = a1 * b2 - a2 * b1;
      if (Math.abs(D) < 1e-9) continue;        // parallel
      const x = (c1 * b2 - c2 * b1) / D;
      const y = (a1 * c2 - a2 * c1) / D;
      if (!isFinite(x) || !isFinite(y)) continue;
      // ---- 2. keep it only if it satisfies every constraint --
      let ok = true;
      for (const [a, b, c] of cons) if (a * x + b * y > c + 1e-9) { ok = false; break; }
      if (ok) pts.push([x, y]);
    }
  }
  if (pts.length === 0) return [];

  // ---- 3. sort the points CCW around their centroid ----------
  const [cx, cy] = pts.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
                       .map(s => s / pts.length);
  return pts
    .sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
}

function fitToCanvas(pts: number[][], width: number, height: number, pad = 30) {
  const xs = pts.map(([x]) => x),
        ys = pts.map(([, y]) => y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const hullW = maxX - minX || 1;   // avoid /0 when hull is a point
  const hullH = maxY - minY || 1;

  const scale = Math.min(
    (width  - 2 * pad) / hullW,
    (height - 2 * pad) / hullH,
  );

  const origin = {
    x: pad + (-minX) * scale,
    y: height - pad - (-minY) * scale, // flip Y-axis
  };

  return { scale, origin };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const head = 8;
  const dx   = toX - fromX, dy = toY - fromY;
  const len  = Math.hypot(dx, dy);
  if (len < 1e-3) return;
  const ux = dx / len, uy = dy / len;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineTo(toX - head * (ux +  uy), toY - head * (uy - ux));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - head * (ux -  uy), toY - head * (uy + ux));
  ctx.stroke();
}

/*********************
 *     Component     *
 *********************/
export default function LinearProgramming() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [problem, setProblem] = useState({
    objective: [3, 2],
    constraints: [
      [1, 1, 4],
      [2, 1, 6],
      [-1, 0, 0],
      [0, -1, 0],
    ],
  });
  const [point, setPoint] = useState([0, 0]);
  const [optimal, setOptimal] = useState<number[] | null>(null);
  const [speed, setSpeed] = useState(3);
  const [running, setRunning] = useState(false);
  const [iter, setIter] = useState(0);
  const [path, setPath] = useState<number[][]>([]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // 1. hull + viewport transform
    const hull = hullFromConstraints(problem.constraints);
    const { scale: unit, origin } = fitToCanvas(hull.length ? [...hull , [0, 0]] : [[0, 0]], c.width, c.height, 40);

    /* helper that converts logical → canvas coordinates */
    const toCanvas = (x: number, y: number) => [
      origin.x + x * unit,
      origin.y - y * unit,             // invert Y-axis
    ];

    ctx.clearRect(0, 0, c.width, c.height);

    // 2. axes
    ctx.strokeStyle = '#d4d4d4';
    ctx.beginPath();
    if (origin.y >= 0 && origin.y <= c.height) {
      ctx.moveTo(0, origin.y);
      ctx.lineTo(c.width, origin.y);
    }
    if (origin.x >= 0 && origin.x <= c.width) {
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, c.height);
    }
    ctx.stroke();

    // 3. feasible polygon
    if (hull.length) {
      ctx.beginPath();
      const [sx, sy] = toCanvas(hull[0][0], hull[0][1]);
      ctx.moveTo(sx, sy);
      for (let k = 1; k < hull.length; k++) {
        const [vx, vy] = toCanvas(hull[k][0], hull[k][1]);
        ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fillStyle   = 'rgba(59,130,246,0.15)';
      ctx.strokeStyle = '#3b82f6';
      ctx.fill();
      ctx.stroke();
    }

    // 4. direction vectors
    ctx.strokeStyle = '#f97316';
    for (let i = 1; i < path.length; i++) {
      const [fx, fy] = toCanvas(path[i - 1][0], path[i - 1][1]);
      const [tx, ty] = toCanvas(path[i][0],     path[i][1]);
      drawArrow(ctx, fx, fy, tx, ty);
    }

    // 5. points
    ctx.fillStyle = '#ef4444';
    const [px, py] = toCanvas(point[0], point[1]);
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    if (optimal) {
      ctx.fillStyle = '#22c55e';
      const [ox, oy] = toCanvas(optimal[0], optimal[1]);
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [point, optimal, problem, path]);

  useEffect(draw, [draw]);

  /* actions */
  const randomise = () => {
    // how many edges?
    const n = 3 + Math.floor(Math.random() * 8);   // 3-8 inclusive
    const Rmin = 2, Rmax = 40;                      // radius of the polygon
    const angles = [...Array(n)].map(() => Math.random() * 2 * Math.PI).sort((a, b) => a - b);
    const verts  = angles.map(a => [Math.cos(a) * (Rmin + Math.random() * (Rmax - Rmin)),
                                    Math.sin(a) * (Rmin + Math.random() * (Rmax - Rmin))]);

    // ---- turn every edge into an inequality  a·x + b·y ≤ c ----
    const [cx, cy] = verts.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
                          .map(s => s / n);
    const cons: number[][] = [];
    for (let i = 0; i < n; i++) {
      const [x1, y1] = verts[i];
      const [x2, y2] = verts[(i + 1) % n];
      // inward normal
      const nx =  y2 - y1;
      const ny = -(x2 - x1);
      // choose sign so that the centroid satisfies the inequality
      const sign = (nx * cx + ny * cy < nx * x1 + ny * y1) ? 1 : -1;
      const a =  sign * nx;
      const b =  sign * ny;
      const c =  sign * (nx * x1 + ny * y1);
      cons.push([a, b, c]);
    }

    // objective random but positive
    const obj = [1 + Math.floor(Math.random() * 5), 1 + Math.floor(Math.random() * 5)];

    setProblem({ objective: obj, constraints: cons });
    reset();
  }
  const reset = () => {
    setPoint([0, 0]);
    setOptimal(null);
    setIter(0);
    setRunning(false);
    setPath([]);
  };
  const solve = async () => {
    if (running) return;
    setRunning(true);
    const A = problem.constraints.map((v) => v.slice(0, 2));
    const b = problem.constraints.map((v) => v[2]);
    const solver = new SimplexSolver(problem.objective, A, b);
    const steps = solver.solve();

    for (const s of steps) {
      await new Promise(requestAnimationFrame);
      setPath(p => [...p, s.sol]);
      setPoint(s.sol);
      setIter(i => i + 1);
      if (s.optimal) setOptimal(s.sol);

      const extra = (11 - speed) * 60;
      await new Promise(r => setTimeout(r, extra));
    }

    setRunning(false);
  };

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>
        Linear Programming - Simplex Algorithm <br /> (Phase I & II problems)
      </h1>

      <div className={styles.controls}>
        <button className={styles.button} onClick={randomise}>Randomise</button>
        <button className={styles.button} onClick={solve} disabled={running}>
          Solve
        </button>
        <button className={styles.button} onClick={reset}>Reset</button>
        <label className={styles.speedLabel}>
          speed
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
          />
        </label>
      </div>

      <canvas ref={canvasRef} width={600} height={360} className={styles.canvas}></canvas>
      

      <div className={styles.info}>
        <div>
          point: ({point[0].toFixed(2)}, {point[1].toFixed(2)})
        </div>
        <div>
          objective: {(problem.objective[0] * point[0] + problem.objective[1] * point[1]).toFixed(2)}
        </div>
        <div>iteration: {iter}</div>
      </div>

      <details className={styles.problemDetails}>
        <summary>current problem</summary>
        <div>
          maximise: {problem.objective[0]}x₁ + {problem.objective[1]}x₂
        </div>
        {problem.constraints.map(([a, b, rhs], i) => (
          <div key={i}>
            {a}x₁ + {b}x₂ ≤ {rhs}
          </div>
        ))}
        <div>x₁ ≥ 0</div>
        <div>x₂ ≥ 0</div>
      </details>
    </section>
  );
}
