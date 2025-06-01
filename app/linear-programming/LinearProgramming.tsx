'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './LinearProgramming.module.css';

/****************
 * Simplex core *
 * Phase I + II *
 ****************/
export type Step = { sol: number[]; obj: number; optimal: boolean };
export type LPStatus = 'optimal' | 'unbounded' | 'infeasible' | 'searching';

/**
 * Two‑phase simplex solver that now works whether or not the origin is in the
 * feasible region.  The key fixes are:
 *   1.  **dropArtificial** – any artificial variable that is *still* basic when
 *       Phase I terminates is either pivoted out (degenerate pivot because its
 *       value is 0) or, if the entire row is redundant, that row is dropped.
 *       Afterward every artificial column is removed cleanly and the basis is
 *       remapped.
 *   2.  **buildPhaseIIObjective** – the original objective is reconstructed
 *       from scratch with the correct reduced‑cost row operations so that the
 *       tableau is in canonical form for Phase II.
 */

export class SimplexSolver {
  /* problem data */
  private readonly cOrig: number[];
  private readonly n: number;       // # decision variables
  private m: number;                // # constraints (may shrink after Phase I)

  /* tableau state */
  private tableau: number[][] = []; // (m+1) × (cols) tableau incl. RHS
  private basicVars: number[] = []; // basic variable index per row
  private artificial = new Set<number>();

  /* solver state */
  private status: LPStatus = 'optimal';

  constructor(c: number[], A: number[][], b: number[]) {
    this.cOrig = c.slice();
    this.n = c.length;
    this.m = A.length;
    this.buildPhaseI(A, b);
  }

  /* ---------- top-level driver ---------- */
  solve(maxIter = 1000): { steps: Step[]; status: LPStatus } {
    const steps: Step[] = [];

    /* ---------- Phase I ---------- */
    this.runSimplex(steps, maxIter);
    const phaseIObj = this.tableau.at(-1)!.at(-1)!;   // value of –Σ artificial
    if (phaseIObj > 1e-8) {                          // some artificial > 0
      this.status = 'infeasible';
      return { steps, status: this.status };
    }

    this.dropArtificial();        // remove artificial cols, fix basis

    /* ---------- Phase II ---------- */
    this.buildPhaseIIObjective();
    this.status = 'searching';
    this.runSimplex(steps, maxIter);

    return { steps, status: this.status };
  }

  /* ---------- build initial (Phase I) tableau ---------- */
  private buildPhaseI(A: number[][], b: number[]) {
    const colTypes: ('x' | 's' | 't' | 'a')[] = [];

    const addColumn = (type: 's' | 't' | 'a') => {
      colTypes.push(type);
      const idx = colTypes.length - 1;
      this.tableau.forEach(r => r.splice(idx, 0, 0));
      return idx;
    };

    const extendRow = (row: number[], upto: number) => {
      while (row.length < upto) row.push(0);
    };

    /* decision-variable columns */
    for (let j = 0; j < this.n; j++) colTypes.push('x');

    /* constraint rows */
    for (let i = 0; i < this.m; i++) {
      let row = [...A[i]];
      let rhs = b[i];
      let isLE = true;
      // force feasiblity
      if (rhs < 0) {               // flip sign if RHS is negative
        row = row.map(v => -v);
        rhs = -rhs;
        isLE = !isLE;
      }

      if (isLE) {                  // ≤ : add slack
        const jS = addColumn('s');
        extendRow(row, jS + 1);
        row[jS] = 1;
        this.basicVars.push(jS);
      } else {                     // ≥ : surplus + artificial
        const jT = addColumn('t');
        extendRow(row, jT + 1);
        row[jT] = -1;
        const jA = addColumn('a');
        extendRow(row, jA + 1);
        row[jA] = 1;
        this.artificial.add(jA);
        this.basicVars.push(jA);
      }

      row.push(rhs);
      this.tableau.push(row);
    }

    /* make sure every undefined => 0 (one pass is enough) */
    this.tableau = this.tableau.map(r => r.map(v => v ?? 0));

    /* Phase-I objective  maximise –Σ artificial  */
    const cols = this.tableau[0].length;
    const obj = new Array(cols).fill(0);
    for (const j of this.artificial) obj[j] = 1;

    /* zero out coeffs of basic artificials */
    this.tableau.forEach((row, i) => {
      const bv = this.basicVars[i];
      if (this.artificial.has(bv)) {
        const coeff = obj[bv];                 // −1
        row.forEach((v, j) => (obj[j] -= coeff * v));
      }
    });

    this.tableau.push(obj);
  }

  /* ---------- rebuild true objective for Phase II ---------- */
  private buildPhaseIIObjective() {
    const cols = this.tableau[0].length;
    const obj = new Array(cols).fill(0);

    for (let j = 0; j < this.n; j++) obj[j] = -this.cOrig[j];   // start with –c

    /* add c_B · row_i for each basic decision variable */
    for (let i = 0; i < this.m; i++) {
      const bv = this.basicVars[i];
      if (bv >= 0 && bv < this.n) {
        const cb = this.cOrig[bv];
        for (let j = 0; j < cols; j++) obj[j] += cb * this.tableau[i][j];
      }
    }

    /* canonicalise: make all basic columns reduced costs zero */
    for (let i = 0; i < this.m; i++) {
      const bv = this.basicVars[i];
      const coeff = obj[bv];
      if (Math.abs(coeff) > 1e-12) {
        for (let j = 0; j < cols; j++) obj[j] -= coeff * this.tableau[i][j];
      }
    }

    this.tableau[this.tableau.length - 1] = obj;
  }

  /* ---------- drop artificial columns after Phase I ---------- */
  private dropArtificial() {
    if (this.artificial.size === 0) return;

    /* pivot any still-basic artificial out of the basis */
    for (let i = 0; i < this.m; i++) {
      const bv = this.basicVars[i];
      if (!this.artificial.has(bv)) continue;

      const col = this.tableau[i].findIndex(
        (v, j) => Math.abs(v) > 1e-10 && !this.artificial.has(j)
      );

      if (col !== -1) {
        this.pivot(col, i);        // degenerate pivot (RHS stays 0)
      } else {
        this.tableau.splice(i, 1);
        this.basicVars.splice(i, 1);
        this.m--;                  // keep m consistent // redundant row
      }
    }

    /* rebuild tableau without artificial columns */
    const keep: number[] = [];
    this.tableau[0].slice(0, -1).forEach((_, j) => {
      if (!this.artificial.has(j)) keep.push(j);
    });

    this.tableau = this.tableau.map(r => [...keep.map(j => r[j]), r.at(-1)!]);

    /* remap basic variable indices */
    const map = new Map<number, number>();
    keep.forEach((oldIdx, newIdx) => map.set(oldIdx, newIdx));
    this.basicVars = this.basicVars.map(j => (j === -1 ? -1 : map.get(j)!));

    this.artificial.clear();
  }

  /* ---------- simplex iterations (one phase) ---------- */
  private runSimplex(steps: Step[], maxIter: number) {
    let k = 0;
    while (k < maxIter) {
      const e = this.entering();
      if (e === -1) {
        this.status = 'optimal';
        break;
      }
      const l = this.leaving(e);
      if (l === -1) { this.status = 'unbounded'; break; }
      this.pivot(e, l);
      steps.push({ sol: this.solution(), obj: this.objective(), optimal: false });
      k++;
    }
    steps.push({ sol: this.solution(), obj: this.objective(), optimal: this.status === 'optimal' });
  }

  /* ---------- helpers ---------- */
  private solution(): number[] {
    const x = Array(this.n).fill(0);
    for (let i = 0; i < this.m; i++) {
      const bv = this.basicVars[i];
      if (bv >= 0 && bv < this.n) x[bv] = this.tableau[i].at(-1)!;
    }
    return x;
  }

  private colHasPositive(col: number, eps = 1e-12): boolean {
    for (let i = 0; i < this.m; i++) if (this.tableau[i][col] > eps) return true;
    return false;
  }

  private entering(): number {
    const obj = this.tableau.at(-1)!;
    let e = -1, mostNeg = 0;
    for (let j = 0; j < obj.length - 1; j++) {
      if (obj[j] < mostNeg - 1e-12 && this.colHasPositive(j)) {
        mostNeg = obj[j]; e = j;
      }
    }
    return e;                    // −1 => optimal
  }

  private leaving(e: number): number {
    let l = -1, best = Infinity;
    for (let i = 0; i < this.m; i++) {
      const a = this.tableau[i][e];
      const b = this.tableau[i].at(-1)!;
      if (a > 1e-12 && b >= -1e-12) {
        const ratio = b / a;
        if (ratio < best - 1e-12) { best = ratio; l = i; }
      }
    }
    return l;                    // −1 => unbounded
  }

  private pivot(e: number, l: number) {
    const p = this.tableau[l][e];
    this.tableau[l] = this.tableau[l].map(v => v / p);
    for (let i = 0; i < this.tableau.length; i++) {
      if (i === l) continue;
      const m = this.tableau[i][e];
      this.tableau[i] = this.tableau[i].map((v, j) => v - m * this.tableau[l][j]);
    }
    this.basicVars[l] = e;
  }

  private objective(): number { return this.tableau.at(-1)!.at(-1)!; }
}

function hullFromConstraints(cons: number[][]): number[][] {
  const pts: number[][] = [];
  for (let i = 0; i < cons.length; i++) {
    for (let j = i + 1; j < cons.length; j++) {
      const [a1, b1, c1] = cons[i];
      const [a2, b2, c2] = cons[j];
      const D = a1 * b2 - a2 * b1;
      if (Math.abs(D) < 1e-9) continue;
      const x = (c1 * b2 - c2 * b1) / D;
      const y = (a1 * c2 - a2 * c1) / D;
      if (!isFinite(x) || !isFinite(y)) continue;
      let ok = true;
      for (const [a, b, c] of cons) if (a * x + b * y > c + 1e-9) { ok = false; break; }
      if (ok) pts.push([x, y]);
    }
  }
  if (pts.length === 0) return [];
  const [cx, cy] = pts.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]).map(s => s / pts.length);
  return pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
}

function fitToCanvas(pts: number[][], width: number, height: number, pad = 30) {
  const xs = pts.map(([x]) => x), ys = pts.map(([, y]) => y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const hullW = maxX - minX || 1, hullH = maxY - minY || 1;
  const scale = Math.min((width - 2 * pad) / hullW, (height - 2 * pad) / hullH);
  const origin = { x: pad + (-minX) * scale, y: height - pad - (-minY) * scale };
  return { scale, origin };
}

export function tween(
  from: number[],
  to: number[],
  updatePoint: (p: number[]) => void,
  duration = 600,
  easing = (t: number) => t * t * (3 - 2 * t),
  onDrawStep?: (intermediate: number[]) => void
) {
  return new Promise<void>(resolve => {
    const t0 = performance.now();
    function frame(now: number) {
      const t = Math.min(1, (now - t0) / duration);
      const p = from.map((v, i) => v + (to[i] - v) * easing(t));
      updatePoint(p);
      onDrawStep?.(p);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

/*********************
 *     Component     *
 *********************/
export default function LinearProgramming() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [problem, setProblem] = useState({
    objective: [3, 2],
    constraints: [
      [ 9, 10, 899 ],
      [ 7, -7, 63 ],
      [ 3, 3, 327 ],
      [ 0, 8, 425 ],
      [ -2, 4, 116 ],
      [ 8, 2, 453 ],
      [ 2, 17, 1087 ],
      [ -10, 3, -67 ],
      [ 1, 8, 431 ],
      [ 3, 6, 354 ],
      [ -5, -2, -151 ],
      [ -12, 4, 81 ],
      [ -4, -8, -328 ],
      [ -8, 3, -9 ],
      [ 2, -6, -133 ],
      [ -4, -19, -475 ],
      [ -4, 2, -56 ],
      [ -7, -4, -218 ],
      [ -2, -11, -152 ],
      [ -2, -7, -124 ],
      [ 13, 2, 581 ],
      [ -4, -18, -493 ],
      [ -4, -5, -311 ],
      [ 15, -10, 645 ],
      [ 1, 3, 163 ],
    ],
  });
  const [point, setPoint] = useState([0, 0]);
  const [optimal, setOptimal] = useState<number[] | null>(null);
  const [speed, setSpeed] = useState(5);
  const [running, setRunning] = useState(false);
  const [iter, setIter] = useState(0);
  const [path, setPath] = useState<number[][]>([]);
  const [trailSegment, setTrailSegment] = useState<[number[], number[]] | null>(null);

  /* ---------- hi‑DPI canvas setup ---------- */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio ?? 1;
    const rect = c.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    c.width = width * dpr;
    c.height = height * dpr;

    const ctx = c.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const width = c.getBoundingClientRect().width;
    const height = c.getBoundingClientRect().height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Draw faint grid lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x <= width; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 1. hull + viewport transform
    const hull = hullFromConstraints(problem.constraints);
    const { scale: unit, origin } = fitToCanvas(hull.length ? [...hull , [0, 0]] : [[0, 0]], width, height, 40);

    /* helper that converts logical => canvas coordinates */
    const toCanvas = (x: number, y: number) => [
      origin.x + x * unit,
      origin.y - y * unit,
    ];

    // 2. axes
    ctx.strokeStyle = '#d4d4d4';
    ctx.beginPath();
    if (origin.y >= 0 && origin.y <= height) {
      ctx.moveTo(0, origin.y);
      ctx.lineTo(width, origin.y);
    }
    if (origin.x >= 0 && origin.x <= width) {
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, height);
    }
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (origin.y >= 10) {
      ctx.fillText('x₁', width - 20, origin.y + 5);
    }
    if (origin.x <= width - 30) {
      ctx.fillText('x₂', origin.x + 5, 10);
    }

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
    // 3.5 Draw all constraint lines as dotted
    for (const [a, b, c] of problem.constraints) {
      const pts: number[][] = [];

      if (Math.abs(b) > 1e-6) {
        const x1 = -1000, y1 = (c - a * x1) / b;
        const x2 = 1000, y2 = (c - a * x2) / b;
        pts.push(toCanvas(x1, y1), toCanvas(x2, y2));
      } else if (Math.abs(a) > 1e-6) {
        const y1 = -1000, x1 = (c - b * y1) / a;
        const y2 = 1000, x2 = (c - b * y2) / a;
        pts.push(toCanvas(x1, y1), toCanvas(x2, y2));
      } else continue;

      const [[x1, y1], [x2, y2]] = pts;

      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3.6 Draw solid edges along the convex hull
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    for (let i = 0; i < hull.length; i++) {
      const [x1, y1] = toCanvas(hull[i][0], hull[i][1]);
      const [x2, y2] = toCanvas(hull[(i + 1) % hull.length][0], hull[(i + 1) % hull.length][1]);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  
    // 4. Live direction vectors
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    for (let i = 1; i < path.length; i++) {
      const [fx, fy] = toCanvas(path[i - 1][0], path[i - 1][1]);
      const [tx, ty] = toCanvas(path[i][0],     path[i][1]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    // 4.5 trail segment (current tween step)
    if (trailSegment) {
      const [[fx, fy], [tx, ty]] = trailSegment;
      const [cx1, cy1] = toCanvas(fx, fy);
      const [cx2, cy2] = toCanvas(tx, ty);
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
      ctx.stroke();
    }

    // 5. points
    const [px, py] = toCanvas(point[0], point[1]);
    const isOptimal =
      optimal &&
      Math.abs(point[0] - optimal[0]) < 1e-6 &&
      Math.abs(point[1] - optimal[1]) < 1e-6;

    ctx.fillStyle = isOptimal ? '#22c55e' : '#ec4899';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [point, optimal, problem, path, trailSegment]);

  useEffect(draw, [draw]);

  const randomise = () => {
    // Create a skewed octagon (same as before)
    const n = 15;
    const baseRadius = 15 + Math.random() * 15; // 15-30 base radius
    
    // Start with regular octagon angles, then add skew
    const baseAngles = [...Array(n)].map((_, i) => (i * 2 * Math.PI) / n);
    
    // Add random skew to each angle (but keep them ordered)
    const skewFactor = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
    // (angle, i)
    const angles = baseAngles.map(angle => {
      const skew = (Math.random() - 0.5) * skewFactor;
      return angle + skew;
    }).sort((a, b) => a - b);
    
    // Create vertices with varying radii for more interesting shapes
    const verts = angles.map(angle => {
      const radiusVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3 multiplier
      const radius = baseRadius * radiusVariation;
      return [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ];
    });

    // Add some overall skew/shear to the entire shape
    const shearX = (Math.random() - 0.5) * 0.3; // -0.15 to 0.15
    const shearY = (Math.random() - 0.5) * 0.3;
    const skewedVerts = verts.map(([x, y]) => [
      x + shearY * y,
      y + shearX * x
    ]);

    // This forces Phase I to find an initial BFS since (0,0) won't be feasible
    const minX = Math.min(...skewedVerts.map(v => v[0]));
    const minY = Math.min(...skewedVerts.map(v => v[1]));
    const pad  = 5;
    const dx   = (minX < 0 ? -minX : 0) + pad;
    const dy   = (minY < 0 ? -minY : 0) + pad;

    const translatedVerts = skewedVerts.map(([x, y]) => [
      Math.round(x + dx),
      Math.round(y + dy)
    ]);

    // ---- turn every edge into an inequality  a·x + b·y ≤ c ----
    const [cx, cy] = translatedVerts.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
                                   .map(s => s / n);
    const cons: number[][] = [];
    for (let i = 0; i < n; i++) {
      const [x1, y1] = translatedVerts[i];
      const [x2, y2] = translatedVerts[(i + 1) % n];
      // inward normal
      const nx =  y2 - y1;
      const ny = -(x2 - x1);
      // choose sign so that the centroid satisfies the inequality
      const sign = (nx * cx + ny * cy < nx * x1 + ny * y1) ? 1 : -1;
      const a =  sign * nx;
      const b =  sign * ny;
      let c =  sign * (nx * x1 + ny * y1);

      // randomly change them to avoid degeneracy
      const perturbation = (Math.random() - 0.5) * 2;
      c += perturbation;

      cons.push([a, b, c]);
    }

    // objective random but positive
    const obj = [1 + Math.floor(Math.random() * 5), 1 + Math.floor(Math.random() * 5)];

    cons.push([-1, 0, 0]);  // x₁ ≥ 0
    cons.push([0, -1, 0]);  // x₂ ≥ 0

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

    const start = point.slice();

    const A = problem.constraints.map(v => v.slice(0, 2));
    const b = problem.constraints.map(v => v[2]);
    const solver = new SimplexSolver(problem.objective, A, b);
    const { steps, status } = solver.solve();

    await tween(
      start,
      steps[0].sol,
      setPoint,
      1500 / speed,
      undefined,
      current => setTrailSegment([start, current])
    );
    setTrailSegment(null);

    setPath([start, steps[0].sol]);
    setIter(1);

    for (let k = 1; k < steps.length; k++) {
      await tween(
        steps[k - 1].sol,
        steps[k].sol,
        setPoint,
        1200 / speed,
        undefined,
        (current) => {
          setTrailSegment([steps[k - 1].sol, current]);
        }
      );
      setTrailSegment(null);
      setPath(p => [...p, steps[k].sol]);
      setIter(i => i + 1);
      if (steps[k].optimal) setOptimal(steps[k].sol);
    }

    if (steps.length > 0 && steps[steps.length - 1].optimal) {
      setOptimal(steps[steps.length - 1].sol);
    }

    if (status === 'infeasible')
      console.log('This linear program is infeasible - no point satisfies all constraints.');
    else if (status === 'unbounded')
      console.log('The objective is unbounded - it can grow without limit.');

    setRunning(false);
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            Linear Programming - Simplex Algorithm
          </h1>
        </div>

        {/* Controls Panel */}
        <div className={styles.controls}>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={randomise}
            disabled={running}
          >
            Randomise
          </button>
          
          <button 
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={solve} 
            disabled={running}
          >
            {running ? 'Solving...' : 'Solve'}
          </button>
          
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={reset}
          >
            Reset
          </button>
          
          <div className={styles.speedControl}>
            <span>Speed</span>
            <input
              type="range"
              min={1}
              max={10}
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
              className={styles.slider}
            />
            <span className={styles.speedValue}>
              {speed}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles.mainContent}>
          {/* Canvas Container - Square */}
          <div className={styles.canvasContainer}>
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={600} 
              className={styles.canvas}
            />
          </div>

          {/* Right Side Info Cards */}
          <div className={styles.sideInfo}>
            {/* Current Problem Card */}
            <div className={styles.infoCard}>
              <h2 className={styles.cardHeader}>Current Problem</h2>
              <div className={styles.problemContent}>
                <div className={styles.objectiveBox}>
                  <div className={styles.objectiveLabel}>Maximize:</div>
                  <div className={styles.objectiveFormula}>
                    {problem.objective[0]}x₁ + {problem.objective[1]}x₂
                  </div>
                </div>
              </div>
            </div>

            {/* Current State Card */}
            <div className={styles.infoCard}>
              <h2 className={styles.cardHeader}>
                <div className={styles.statusDot}></div>
                Current State
              </h2>
              <div className={styles.infoItems}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Point:</span>
                  <span className={`${styles.infoValue} ${styles.infoValueBlue}`}>
                    ({point[0].toFixed(2)}, {point[1].toFixed(2)})
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Objective:</span>
                  <span className={`${styles.infoValue} ${styles.infoValuePurple}`}>
                    {(problem.objective[0] * point[0] + problem.objective[1] * point[1]).toFixed(2)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Iteration:</span>
                  <span className={`${styles.infoValue} ${styles.infoValueAmber}`}>{iter}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Constraints - Full Width Below */}
        <div className={styles.infoCard}>
          <h2 className={styles.cardHeader}>Constraints</h2>
          <div className={styles.constraintsSection}>
            <div className={styles.constraintsLabel}>Subject to:</div>
            {problem.constraints.map(([a, b, rhs], i) => (
              <div key={i} className={styles.constraint}>
                {a}x₁ + {b}x₂ ≤ {rhs}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
