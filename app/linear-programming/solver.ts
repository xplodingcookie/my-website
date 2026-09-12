/****************
 * Simplex core *
 * Phase I + II *
 ****************/
export type Step = { sol: number[]; obj: number; optimal: boolean; phase: 'feasibility' | 'optimisation' };
export type LPStatus = 'optimal' | 'unbounded' | 'infeasible' | 'searching';

export class SimplexSolver {
  /* problem data */
  private readonly cOrig: number[];
  private readonly n: number;       // # decision variables
  private m: number;                // # constraints (may shrink after Phase I)

  /* tableau state */
  private tableau: number[][] = []; // (m+1) x (cols) tableau with RHS
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
    this.status = 'searching';
    const phaseIStatus = this.runSimplex(steps, maxIter, 'feasibility');
    if (phaseIStatus !== 'optimal') return { steps, status: phaseIStatus };
    const phaseIObj = this.tableau.at(-1)!.at(-1)!;   // value of –sigma artificial
    if (phaseIObj < -1e-8) {  // some artificial > 0
      this.status = 'infeasible';
      return { steps, status: this.status };
    }

    steps.forEach(step => { step.optimal = false; });
    this.dropArtificial();  // remove artificial cols, fix basis

    /* ---------- Phase II ---------- */
    this.buildPhaseIIObjective();
    this.status = 'searching';
    this.runSimplex(steps, maxIter, 'optimisation');

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

    /* Phase-I objective  maximise –sigma artificial  */
    const cols = this.tableau[0]?.length ?? this.n + 1;
    const obj = new Array(cols).fill(0);
    for (const j of this.artificial) obj[j] = 1;

    /* zero out coeffs of basic artificials */
    this.tableau.forEach((row, i) => {
      const bv = this.basicVars[i];
      if (this.artificial.has(bv)) {
        const coeff = obj[bv];
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
        (v, j) => j < this.tableau[i].length - 1 && Math.abs(v) > 1e-10 && !this.artificial.has(j)
      );

      if (col !== -1) {
        this.pivot(col, i);        // degenerate pivot (RHS stays 0)
      } else {
        this.tableau.splice(i, 1);
        this.basicVars.splice(i, 1);
        this.m--;
        i--; // inspect the row that shifted into this position
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
  private runSimplex(steps: Step[], maxIter: number, phase: Step['phase']): LPStatus {
    steps.push({ sol: this.solution(), obj: this.objective(), optimal: false, phase });
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
      steps.push({ sol: this.solution(), obj: this.objective(), optimal: false, phase });
      k++;
    }
    steps.push({ sol: this.solution(), obj: this.objective(), optimal: this.status === 'optimal', phase });
    return this.status;
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

  private entering(): number {
    // Bland's rule prevents cycling. A negative reduced cost with no leaving
    // row must reach the unbounded check, rather than be mistaken for optimal.
    const obj = this.tableau.at(-1)!;
    return obj.slice(0, -1).findIndex(value => value < -1e-12);
  }

  private leaving(e: number): number {
    let l = -1, best = Infinity;
    for (let i = 0; i < this.m; i++) {
      const a = this.tableau[i][e];
      const b = this.tableau[i].at(-1)!;
      if (a > 1e-12 && b >= -1e-12) {
        const ratio = b / a;
        if (ratio < best - 1e-12 || (Math.abs(ratio - best) <= 1e-12 && (l === -1 || this.basicVars[i] < this.basicVars[l]))) { best = ratio; l = i; }
      }
    }
    // −1 => unbounded
    return l;
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

