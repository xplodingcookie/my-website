"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { MotionValue } from "framer-motion";
import HeroFallback from "./HeroFallback";

const END_Z = -6.5;
export default function HeroScene({
  progress,
  paused,
  reduced,
}: {
  progress: MotionValue<number>;
  paused: boolean;
  reduced: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const reducedRef = useRef(reduced);
  const resumeRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    pausedRef.current = paused;
    reducedRef.current = reduced;
    resumeRef.current();
  }, [paused, reduced]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let SCENE_LIFT = 0.55;
    let active = false;
    let copyTopRatio = 0.65;
    const projected = new THREE.Vector3();
    /* ── scene, camera, renderer ── */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch {
      return;
    }
    setReady(true);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();

    /* generated environment map — makes the crane's pearlescent material
       sing. Only mesh materials sample it; the wireframes are unaffected. */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    room.dispose();
    const envTexture = environment.texture;
    scene.environment = envTexture;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

    /* start further back on narrow screens so the solid isn't wall-to-wall */
    let startZ = 5.5;
    camera.position.z = startZ;

    /* ── Geometries and helper ── */
    const geometries = [
      new THREE.TetrahedronGeometry(1),
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.OctahedronGeometry(1),
      new THREE.DodecahedronGeometry(1),
      new THREE.IcosahedronGeometry(1),
    ];
    const createPoly = (
      g: THREE.BufferGeometry,
      opacity = 1,
      pointSize = 0.05,
    ) => {
      const group = new THREE.Group();
      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(g),
          new THREE.LineBasicMaterial({
            color: 0x17171d,
            transparent: true,
            opacity,
          }),
        ),
      );
      group.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            color: 0x17171d,
            size: pointSize,
            transparent: true,
            opacity,
            sizeAttenuation: true,
          }),
        ),
      );
      return group;
    };

    /* ── Foreground solid, inside a holder that follows the pointer ── */
    const holder = new THREE.Group();
    holder.position.y = SCENE_LIFT;
    scene.add(holder);
    // Cache the five original solids instead of allocating on every morph.
    const solids = geometries.map((g) => createPoly(g));
    let idx = 0;
    let current = solids[idx];
    holder.add(current);

    /* ── Paper-plane companion: a classic dart folded from pearlescent
       paper — pinched keel below, long narrow wings in layered fold
       panels. Hidden at rest; it fades in as the dive begins. ── */
    const planeMats: THREE.Material[] = [];
    const inkMats: THREE.Material[] = [];

    /* the site's gradient as paint: indigo → violet → sky */
    const GRAD = [
      new THREE.Color(0x6366f1), // indigo-500
      new THREE.Color(0xa855f7), // purple-500
      new THREE.Color(0x38bdf8), // sky-400
    ];
    const gradAt = (t: number) => {
      const x = THREE.MathUtils.clamp(t, 0, 1) * (GRAD.length - 1);
      const i = Math.min(Math.floor(x), GRAD.length - 2);
      return new THREE.Color().lerpColors(GRAD[i], GRAD[i + 1], x - i);
    };

    /* pearlescent origami paper: per-vertex gradient + clearcoat glints +
       thin-film iridescence, so the hue shifts as the dart banks */
    const paper = (
      tris: number[],
      colorAt: (x: number, y: number, z: number) => THREE.Color,
    ) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(tris, 3));
      const cols: number[] = [];
      for (let i = 0; i < tris.length; i += 3) {
        const c = colorAt(tris[i], tris[i + 1], tris[i + 2]);
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      const mat = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.4,
        metalness: 0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.35,
        iridescence: 0.9,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [120, 480],
        envMapIntensity: 1.1,
        /* soft self-light floor so no facet ever drops out */
        emissive: 0xffffff,
        emissiveIntensity: 0.1,
        flatShading: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });
      planeMats.push(mat);
      const mesh = new THREE.Mesh(g, mat);
      const ink = new THREE.LineBasicMaterial({
        color: 0x17171d,
        transparent: true,
        opacity: 0,
      });
      inkMats.push(ink);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 15), ink));
      return mesh;
    };

    const plane = new THREE.Group();
    const pearlWhite = new THREE.Color(0xffffff);
    const lavender = new THREE.Color(0xc4b5fd);

    /* keel: the pinched body fold under the wings — a shallow tent of two
       faces meeting at the centre crease, deepest at the rear */
    plane.add(
      paper(
        [
          0, 0.02, -0.72, -0.02, -0.18, 0.42, 0, 0.04, 0.48, 0, 0.02, -0.72, 0,
          0.04, 0.48, 0.02, -0.18, 0.42,
        ],
        /* pearl at the crease shading to lavender at the keel's depth */
        (_x, y) =>
          pearlWhite
            .clone()
            .lerp(lavender, THREE.MathUtils.clamp((0.02 - y) / 0.22, 0, 1)),
      ),
    );

    /* wings: long and narrow like a real dart, each in two panels — the
       inner strip dips toward the body and the main panel rises past the
       fold line, so the layered folds catch the light separately */
    const makeWing = (dir: 1 | -1) => {
      const wing = new THREE.Group();
      wing.position.set(0, 0.02, 0);
      wing.add(
        paper(
          [
            /* inner fold strip along the body */
            0,
            0,
            -0.72,
            dir * 0.11,
            -0.012,
            0.46,
            0,
            0.015,
            0.48,
            /* main wing panel, rising from the fold line to the tip */
            0,
            0,
            -0.72,
            dir * 0.44,
            0.055,
            0.4,
            dir * 0.11,
            -0.012,
            0.46,
          ],
          /* span gradient: near-white at the body, indigo → sky at the tip */
          (x) =>
            Math.abs(x) < 0.115
              ? pearlWhite.clone().lerp(gradAt(0.1), Math.abs(x) / 0.115)
              : gradAt(Math.abs(x) / 0.44),
        ),
      );
      return wing;
    };
    const leftWing = makeWing(-1);
    const rightWing = makeWing(1);
    plane.add(leftWing, rightWing);

    plane.scale.setScalar(0.9);
    plane.position.set(0.4, SCENE_LIFT - 0.45, startZ - 2.8);
    plane.rotation.set(-0.06, 0, 0);
    scene.add(plane);

    /* mostly-ambient lighting: bright paper everywhere, gentle facet
       shading — a hard key light turns the undersides into grey shards.
       The wireframe solids use unlit materials and are unaffected. */
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe6dff7, 2.3));
    const sun = new THREE.DirectionalLight(0xfff6e8, 0.7);
    sun.position.set(-2, 3, 2);
    scene.add(sun);

    let flutterPhase = 0;
    let prevPlaneX = plane.position.x;
    let prevPlaneY = plane.position.y;
    let smoothVx = 0;
    let smoothVy = 0;
    let divePitch = 0;

    /* ── Field: small solids scattered along the flight path so the space
       ahead stays alive — placed on a golden-angle spiral around the
       camera axis, never dead-centre in the way ── */
    const FIELD_COUNT = 14;
    const fieldSpin: number[] = [];
    const field = new THREE.Group();
    for (let i = 0; i < FIELD_COUNT; i++) {
      const angle = i * 2.399963; // golden angle
      const radius = 1.3 + (i % 3) * 0.55;
      const size = 0.14 + (i % 4) * 0.06;
      const piece = createPoly(
        geometries[i % geometries.length].clone(),
        0.28,
        0.02,
      );
      piece.scale.setScalar(size);
      piece.position.set(
        Math.cos(angle) * radius,
        SCENE_LIFT + Math.sin(angle) * radius * 0.7,
        -0.6 - i * 0.5,
      );
      piece.rotation.set(i * 0.7, i * 1.3, 0);
      fieldSpin.push(0.002 + (i % 5) * 0.0012);
      field.add(piece);
    }
    scene.add(field);
    const fieldMaterials = field.children.map((piece) =>
      piece.children.map(
        (object) => (object as THREE.Mesh).material as THREE.Material,
      ),
    );

    const updateFieldOpacity = (pr: number) => {
      camera.updateMatrixWorld();
      field.children.forEach((piece, i) => {
        // Give the introduction clear space at rest; the full original field
        // returns as soon as the visitor enters the flight.
        projected.copy(piece.position).project(camera);
        const clearance =
          1 -
          THREE.MathUtils.smoothstep(
            (1 - projected.y) / 2,
            copyTopRatio - 0.08,
            copyTopRatio,
          );
        const opacity =
          0.28 * THREE.MathUtils.lerp(clearance, 1, Math.min(pr / 0.13, 1));
        fieldMaterials[i].forEach((material) => {
          material.opacity = opacity;
        });
      });
    };

    /* ── Pointer tracking ── */
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      if (
        !active ||
        pausedRef.current ||
        reducedRef.current ||
        e.pointerType === "touch"
      )
        return;
      const bounds = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = ((e.clientY - bounds.top) / bounds.height) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* ── Resize ── */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      startZ = camera.aspect < 0.9 ? 6.6 : 5.5;
      const previousLift = SCENE_LIFT;
      SCENE_LIFT = camera.aspect < 0.9 && h < 600 ? 1.65 : 0.55;
      holder.scale.setScalar(camera.aspect < 0.9 && h < 600 ? 0.85 : 1);
      const copy = canvas.closest("section")?.querySelector("[data-hero-copy]");
      if (copy)
        copyTopRatio =
          (copy.getBoundingClientRect().top -
            canvas.getBoundingClientRect().top) /
          h;
      field.children.forEach((piece) => {
        piece.position.y += SCENE_LIFT - previousLift;
      });
      holder.position.y = SCENE_LIFT;
      syncCamera();
      renderer.render(scene, camera);
    };

    /* ── Deterministic timing & easing ── */
    const SHRINK_DUR = 0.2;
    const GROW_DUR = 0.8;
    const START_TO_START_MS = 3500;
    const FIRST_DELAY_MS = 100;

    const easeInCubic = (x: number) => x * x * x;
    const easeOutBack = (x: number, s = 1.70158) =>
      --x * x * ((s + 1) * x + s) + 1;
    const smoothstep = (x: number) => x * x * (3 - 2 * x);

    /* ── Transition state machine ── */
    type Phase = "idle" | "shrinking" | "growing";
    let phase: Phase = "idle";
    let t = 0;

    const trigger = () => {
      if (phase === "idle") {
        t = 0;
        phase = "shrinking";
      }
    };

    let nextMorph = FIRST_DELAY_MS / 1000;

    /* ── Animation loop ── */
    let rafId = 0;
    let lastTime = 0;
    let elapsed = 0;
    const tick = (now: number) => {
      rafId = 0;
      if (!active || pausedRef.current || reducedRef.current) return;
      const dt = Math.min(lastTime ? (now - lastTime) / 1000 : 1 / 60, 0.05);
      lastTime = now;
      elapsed += dt;
      if (elapsed >= nextMorph) {
        trigger();
        nextMorph += START_TO_START_MS / 1000;
      }

      current.rotation.x += 0.6 * dt;
      current.rotation.y += 0.78 * dt;

      /* camera dive: scroll progress → dolly through both solids, damped */
      const pr = progress.get();
      const targetZ = startZ + (END_Z - startZ) * pr;
      const targetY = SCENE_LIFT * smoothstep(Math.min(pr / 0.35, 1));
      camera.position.z += (targetZ - camera.position.z) * 0.09;
      camera.position.y += (targetY - camera.position.y) * 0.09;

      /* pointer tilt fades as the dive takes over, so the flight stays true */
      const steer = 1 - Math.min(pr * 2.5, 1);
      holder.rotation.x += (pointer.y * 0.3 * steer - holder.rotation.x) * 0.04;
      holder.rotation.y += (pointer.x * 0.4 * steer - holder.rotation.y) * 0.04;
      holder.position.y = SCENE_LIFT + Math.sin(elapsed * 0.8) * 0.05;
      camera.position.x +=
        (pointer.x * 0.12 * steer - camera.position.x) * 0.04;

      /* the dart fades in as the dive begins and leads the flight */
      const planeVis = THREE.MathUtils.clamp((pr - 0.04) / 0.08, 0, 1);
      for (const mat of planeMats) mat.opacity = planeVis;
      for (const mat of inkMats) mat.opacity = planeVis * 0.45;

      /* fly-by: as the dart reaches the hero solid it breaks off its
         wander and rounds the solid like a pylon turn — swinging wide
         to one side while rising to the solid's waist, then settling
         back onto its path. Staying at screen-centre height keeps the
         whole turn in frame. Keyed to the dart's own z so it plays
         forward on the dive and scrubs backward on scroll-up. */
      const planeZ = camera.position.z - 2.8;
      const flyby = THREE.MathUtils.clamp((2.2 - planeZ) / 4.4, 0, 1);
      const flybyW = Math.sin(flyby * Math.PI); // 0 → 1 → 0 across the pass
      const orbitX = flybyW * 1.4;
      const orbitY = flybyW * 0.35;

      /* wandering flight path + tiny corrections, like riding air
         currents — the wander yields to the fly-by arc mid-pass */
      const swayX =
        (Math.sin(elapsed * 0.55) * 0.75 + pointer.x * 0.25) *
          (1 - flybyW * 0.85) +
        0.02 * Math.sin(elapsed * 2.9 + 1.7) +
        0.012 * Math.sin(elapsed * 4.3) +
        orbitX;
      const swayY =
        SCENE_LIFT -
        0.45 +
        (Math.sin(elapsed * 1.15 + 1) * 0.22 - pointer.y * 0.15) *
          (1 - flybyW * 0.6) +
        0.015 * Math.sin(elapsed * 3.4 + 0.6) +
        orbitY;

      /* a dart doesn't flap — it glides, wings buzzing in the airstream.
         Flutter speed and amplitude rise with dive speed; the wings trim
         slightly flatter when moving fast. */
      const diveSpeed = Math.abs(targetZ - camera.position.z);
      flutterPhase += dt * (7 + Math.min(diveSpeed * 8, 10));
      const flutterAmp = 0.015 + Math.min(diveSpeed * 0.05, 0.04);
      const flutL = Math.sin(flutterPhase) * flutterAmp;
      const flutR = Math.sin(flutterPhase + 0.9) * flutterAmp;
      /* enough V that the wing surfaces read even from dead astern */
      const dihedral = 0.2 - Math.min(diveSpeed * 0.04, 0.04);
      leftWing.rotation.z = -(dihedral + flutL);
      rightWing.rotation.z = dihedral + flutR;

      /* the run-out: over the last stretch of the dive the dart stops
         wandering and lines up dead centre, flying straight into the
         light as the scene fades */
      const endW = smoothstep(THREE.MathUtils.clamp((pr - 0.55) / 0.3, 0, 1));
      const planeTargetX = THREE.MathUtils.lerp(swayX, 0, endW);
      const planeTargetY = THREE.MathUtils.lerp(swayY, SCENE_LIFT, endW);

      /* chase speed rises with dive speed so a hard scroll never leaves
         the dart trailing off-path; tighter still mid-fly-by and on the
         final line-up */
      const chase =
        0.055 + flybyW * 0.05 + endW * 0.06 + Math.min(diveSpeed * 0.03, 0.05);
      plane.position.x += (planeTargetX - plane.position.x) * chase;
      plane.position.y += (planeTargetY - plane.position.y) * (chase + 0.02);
      plane.position.z = camera.position.z - 2.8;

      /* heading follows the flight path: the dart yaws and banks INTO its
         weave, swinging through centre to face left and right in turn.
         The raw velocity is low-passed first — micro air-current wiggles
         stay in the position but must not rock the attitude. */
      const vx = dt > 0 ? (plane.position.x - prevPlaneX) / dt : 0;
      const vy = dt > 0 ? (plane.position.y - prevPlaneY) / dt : 0;
      prevPlaneX = plane.position.x;
      prevPlaneY = plane.position.y;
      const smooth = Math.min(dt * 2, 1);
      smoothVx += (vx - smoothVx) * smooth;
      smoothVy += (vy - smoothVy) * smooth;
      /* the run-out squares the dart up: yaw and bank wash out so it
         finishes wings-level, nose on the light */
      const yawTarget =
        THREE.MathUtils.clamp(-smoothVx * 1.5, -0.65, 0.65) * (1 - endW);
      const bankTarget =
        THREE.MathUtils.clamp(-smoothVx * 2.0, -0.7, 0.7) * (1 - endW);
      plane.rotation.y += (yawTarget - plane.rotation.y) * Math.min(dt * 3, 1);
      plane.rotation.z += (bankTarget - plane.rotation.z) * Math.min(dt * 4, 1);
      /* scrolling deeper → the dart noses over into a dive with you;
         it eases back level once the camera settles */
      const diveForward = camera.position.z - targetZ; // >0 while descending
      divePitch +=
        (THREE.MathUtils.clamp(diveForward * 0.55, -0.12, 0.5) - divePitch) *
        Math.min(dt * 3, 1);
      plane.rotation.x =
        -0.06 -
        divePitch +
        (THREE.MathUtils.clamp(smoothVy * 0.9, -0.25, 0.25) +
          Math.sin(elapsed * 1.15 + 1) * 0.03) *
          (1 - endW);

      updateFieldOpacity(pr);
      field.children.forEach((piece, i) => {
        piece.rotation.x += fieldSpin[i] * dt * 60;
        piece.rotation.y += fieldSpin[i] * 1.4 * dt * 60;
      });

      if (phase === "shrinking") {
        t = Math.min(t + dt, SHRINK_DUR);
        const p = t / SHRINK_DUR;
        const s = 1 - easeInCubic(p);
        current.scale.set(s, s, s);

        if (p === 1) {
          holder.remove(current);
          idx = (idx + 1) % geometries.length;
          current = solids[idx];
          current.rotation.set(0, 0, 0);
          current.scale.set(0, 0, 0);
          holder.add(current);
          phase = "growing";
          t = 0;
        }
      } else if (phase === "growing") {
        t = Math.min(t + dt, GROW_DUR);
        const p = t / GROW_DUR;
        const s = easeOutBack(p);
        current.scale.set(s, s, s);
        if (p === 1) phase = "idle";
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };

    const syncCamera = () => {
      const pr = reducedRef.current ? 0 : progress.get();
      camera.position.set(
        0,
        SCENE_LIFT * smoothstep(Math.min(pr / 0.35, 1)),
        startZ + (END_Z - startZ) * pr,
      );
      const planeVis = THREE.MathUtils.clamp((pr - 0.04) / 0.08, 0, 1);
      planeMats.forEach((mat) => {
        mat.opacity = planeVis;
      });
      inkMats.forEach((mat) => {
        mat.opacity = planeVis * 0.45;
      });
      plane.position.set(0.4, SCENE_LIFT - 0.45, camera.position.z - 2.8);
      updateFieldOpacity(pr);
    };
    const updatePlayback = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastTime = 0;
      if (reducedRef.current) {
        current.scale.setScalar(1);
        phase = "idle";
        syncCamera();
        renderer.render(scene, camera);
      }
      canvas.dataset.motion =
        active && !pausedRef.current && !reducedRef.current
          ? "playing"
          : "paused";
      if (active && !pausedRef.current && !reducedRef.current)
        rafId = requestAnimationFrame(tick);
    };
    resumeRef.current = updatePlayback;
    let inView = false;
    const visibility = () => {
      active =
        inView &&
        !document.hidden &&
        (reducedRef.current || progress.get() < 1);
      updatePlayback();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !active) {
        syncCamera();
        renderer.render(scene, camera);
      }
      visibility();
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", visibility);
    const unsubscribe = progress.on("change", () => {
      const shouldRun =
        inView &&
        !document.hidden &&
        (reducedRef.current || progress.get() < 1);
      if (active !== shouldRun) {
        active = shouldRun;
        updatePlayback();
      }
      if (active && (pausedRef.current || reducedRef.current)) {
        // Scroll is user-driven; a paused scene has no autonomous movement.
        syncCamera();
        renderer.render(scene, camera);
      }
    });
    resize();
    return () => {
      resumeRef.current = () => {};
      cancelAnimationFrame(rafId);
      observer.disconnect();
      resizeObserver.disconnect();
      unsubscribe();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pointermove", onPointerMove);
      const buffers = new Set<THREE.BufferGeometry>(geometries);
      const materials = new Set<THREE.Material>();
      const collect = (obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) buffers.add(mesh.geometry);
        if (mesh.material)
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((mat) => materials.add(mat));
      };
      scene.traverse(collect);
      solids.forEach((solid) => solid.traverse(collect));
      buffers.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [progress]);
  return (
    <div className="hero-scene" data-ready={ready}>
      {!ready && <HeroFallback />}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0 }}
      />
    </div>
  );
}
