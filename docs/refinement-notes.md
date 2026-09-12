# Portfolio refinement

This pass preserves the lavender palette, frog, DIN display font, core section order, date-led timelines, paper plane, and mathematical subject matter. It refines the existing design rather than introducing another identity.

## What changed

- The original full-viewport 3D hero is restored: five morphing solids, pointer response, the surrounding geometric field, and the pearlescent paper-plane flight on scroll. The pinned scene reserves layout space for the introduction and CTAs. Faded content becomes inert; a focused link keeps its introduction visible until focus leaves.
- Experience now separates problem, ownership, engineering, and outcome. The independently developed and deployed webPAS add-in and its use by thousands of hospital staff lead the evidence. These claims come from the original portfolio copy.
- The taxi project shows R² values from the existing report (0.822124 for linear regression; 0.839894 for the neural network), with cleaning counts and concrete modelling decisions. The chart uses a zero-to-one scale and links to the source PDF. It does not claim measured gains in driver income. Inconsistent feature counts and difficult-to-compare MSE values in the report are not promoted.
- The source-code entry is the original playful card — banner image, “ALWAYS A WORK IN PROGRESS :)” caption, “unfinished dreams :P” copy — with the banner redrawn as `public/website_banner.svg` in the site's own language (lavender field, graph paper, constraint lines, the feasible region and its walk, wireframe solids, the paper plane), replacing the off-palette PNG.
- Under the walkthrough commentary, a “maths” panel shows the algebra of the current vertex: the objective evaluated by substitution (z = 3x₁ + 2x₂ = 3(4) + 2(2) = 16) and the boundaries holding with equality there (with an honest fallback for artificial Phase I bases that sit off every boundary), plus a one-line reminder that a vertex is where boundaries meet. It sits outside the aria-live region so screen readers are not spammed per step.
- The Simplex preview and playground share the same problem and SVG graph. The first walkthrough is (0, 0) → (4, 0) → (4, 2), with objective values 0 → 12 → 16. Other examples introduce Phase I, more boundaries, infeasibility, and unboundedness.
- Play, Pause, Next, Previous, Reset, Solve, and Randomise operate on explicit vertex states, with a 1–10 Speed slider (5s down to 0.5s per vertex, default 7 = 2s) in the control row like the original playground. The next-vertex marker appears only once playback is engaged (playing, or past the first vertex) and hides again on Reset. The Current point and Objective z readouts roll through the intermediate values on the same travel plan as the plot marker (`travel.ts` shared by `FeasibleGraph` and `RollingNumber`); the rolled values are aria-hidden with a static screen-reader copy, so the live region announces only settled states. The original session-once intro preloader (icosahedron line-draw, reduced-motion skipped) is restored in the layout with the current background gradient. Playback waits at each vertex for reading. Between vertices the marker walks the pivot's real route — every traversed edge in sequence at a brisk constant pace (~400 viewBox px/s, clamped 0.18–2.2s) — with the trail drawing on in sync via path-length keyframes; single steps ease into their vertex, multi-step jumps (Solve) cruise linearly through every intermediate vertex, and the next-vertex marker fades in only on arrival. Backward moves, problem changes, and reduced motion reposition instantly. Feasibility checks and objective gains remain visible as text.
- The original playground's spectacle is restored on the new architecture: a "Random problem" button generates a skewed integer polygon pushed off the origin (so Phase I genuinely runs), verified before use for feasibility, boundedness, and a walk of at least four steps (`random.ts`, with a verified constant fallback). Every constraint boundary is drawn as a dashed line clipped to the viewing window, so the arrangement of half-planes is visible, not just the hull. The example gallery is open by default.
- The objective coefficients are editable directly in the walkthrough heading ("Maximise [3]x₁ + [2]x₂"), like the original page: a valid value applies immediately (resetting playback, syncing the Experiment editor, relabelling the problem "Your problem"); a partial or invalid value shows the validation message inline and leaves the last valid problem solvable. A visually hidden h2 keeps the section's accessible name; without JavaScript a static formula renders instead.
- The header's active-section marker clamps to the last link at the bottom of the page, so short final sections (Contact) highlight correctly.
- The editor keeps raw string drafts. Whole-number-string validation rejects partial input, empty fields, nonfinite numbers, and magnitudes outside the documented floating-point range. Nothing is silently repaired. Editing pauses playback; changes must be valid and explicitly applied before solving.

## Implementation and accessibility

The hero retains its original Three.js geometry, materials, and flight path. The five morphing solids are cached rather than reallocated each cycle. Rendering stops offscreen, on hidden tabs, when paused, and for reduced motion; it renders a static frame for reduced motion. GPU resources, observers, listeners, and frame callbacks are cleaned up. A wireframe fallback remains available while the scene loads or WebGL is unavailable. Small-screen composition moves the solid above the text, and lower satellites fade behind the introduction at rest before returning during flight.

Problem definitions/validation, the two-phase solver, geometry, playback timing, and graph rendering are separate modules. Feasible-region clipping and solving are memoised by the applied problem. Playback changes state only at vertices; there is no frame-by-frame React render or hull recalculation. The SVG graph replaces the former canvas and provides a server-rendered diagram. The graph uses fixed coordinates so the browser scales every shape together. Axis labels live outside the scaling SVG layer so they stay readable before and after hydration.

Main content does not depend on entrance opacity. Mobile navigation unmounts immediately on dismissal, closes on Escape, and restores toggle focus. Section links focus their destination with mouse, touch, and reduced motion. Without JavaScript, navigation links and content remain available; inactive editing/playback controls are hidden and the example's complete path is provided in text.

## Verification

```sh
npm run lint
npm test
npm run build
```

`tests/solver.test.mjs` covers bounded, Phase-I, infeasible, unbounded, degenerate, redundant, and iteration-limit cases. `tests/problem.test.mjs` covers retained invalid input, valid numeric syntax, feasible-region clipping, and phase metadata.

Run the production site separately from the dev server, since both write `.next`:

```sh
npm run start -- --port 3001
# Install Chromium once; both scripts use the declared playwright-core package.
npx playwright-core install chromium
node tests/browser/refinement.mjs
node tests/browser/hero.mjs
```

Both scripts default to port 3001. If using an existing Chromium installation,
set `CHROMIUM_PATH=/absolute/path/to/chromium` instead of installing a browser.
`PLAYWRIGHT_MODULE` remains an optional override for a custom Playwright installation.

The browser script defaults to `http://127.0.0.1:3001` and writes screenshots to `/tmp/portfolio-final`. Override these with `REVIEW_URL` and `REVIEW_OUTPUT`. It tests 1280×600, 1280×720, 1440×900, 1920×1080, 320×568, 390×844, and 430×932; mouse/touch/keyboard controls; slow pause/reset; invalid inputs; example outcomes; anchor refreshes; reduced motion; offscreen shutdown; and no-JavaScript content.

The earlier SVG-hero JavaScript measurements no longer apply: the original WebGL experience has been restored. `tests/browser/hero.mjs` additionally covers live rendering, all seven viewports with and without reduced motion, pause/resume, inert faded links, focused-link visibility, offscreen shutdown, and refresh during flight.

Browser checks use Chromium and emulated mobile touch. They do not substitute for testing on physical iOS/Android devices or with a screen reader.

## Release review fixes

- Next.js and its lint configuration use patched 15.5.25, and React/React DOM
  stay on patched 19.2.8. Compatible transitive security updates are locked.
  Next.js 15 still pins PostCSS 8.4.31; a scoped override shares the project's
  patched PostCSS 8.5.23+ until the framework removes that vulnerable pin.
- Pending Experiment drafts make the heading coefficients read-only until the
  changes are applied. A nearby explanation keeps the state clear; valid heading
  edits still apply immediately when no draft is pending.
- At viewport heights below 560px the hero scrolls in normal document flow, with
  no scroll fade or camera dive. The links and motion control remain reachable.
  Rotation updates this layout without requiring a page reload.
- Geometry normalises nonzero constraint rows before intersection and clipping;
  equivalent positive scalings preserve the plot. Zero rows are explicitly
  redundant or infeasible.
- Regression checks cover pending valid/invalid drafts, the resulting optimum,
  small and mixed row scalings, zero rows, and 844×390 / 667×375 landscape
  interactions with and without reduced motion.
