"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import styles from "./PolyHero.module.css";
import TextReveal from "./TextReveal";
import { INTRO_DONE_EVENT, INTRO_SEEN_KEY } from "./Preloader";

/** Holds the hero text until the intro curtain lifts (or instantly on revisits). */
function useIntroGate() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(INTRO_SEEN_KEY)) {
      setReady(true);
      return;
    }
    const onDone = () => setReady(true);
    window.addEventListener(INTRO_DONE_EVENT, onDone);
    const safety = setTimeout(onDone, 2800);
    return () => {
      window.removeEventListener(INTRO_DONE_EVENT, onDone);
      clearTimeout(safety);
    };
  }, []);
  return ready;
}

/* The solid sits slightly above screen centre; the camera climbs to this
   height mid-dive so the flight path goes through the solid's heart. */
const SCENE_LIFT = 0.55;
const END_Z = -6.5;

export default function PolyHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  const introReady = useIntroGate();
  const reducedMotion = useReducedMotion();

  /* Scroll progress across the whole pinned track drives the camera dive */
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.6]);
  const haloOpacity = useTransform(scrollYProgress, [0.15, 0.45], [1, 0]);
  const canvasOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = scrollYProgress;

    /* ── scene, camera, renderer ── */
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    /* generated environment map — makes the crane's pearlescent material
       sing. Only mesh materials sample it; the wireframes are unaffected. */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
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
    const createPoly = (g: THREE.BufferGeometry, opacity = 1, pointSize = 0.05) => {
      const group = new THREE.Group();
      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(g),
          new THREE.LineBasicMaterial({ color: 0x17171d, transparent: true, opacity }),
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
    let idx = 0;
    let current = createPoly(geometries[idx]);
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
          0, 0.02, -0.72, -0.02, -0.18, 0.42, 0, 0.04, 0.48,
          0, 0.02, -0.72, 0, 0.04, 0.48, 0.02, -0.18, 0.42,
        ],
        /* pearl at the crease shading to lavender at the keel's depth */
        (_x, y) => pearlWhite.clone().lerp(lavender, THREE.MathUtils.clamp((0.02 - y) / 0.22, 0, 1)),
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
            0, 0, -0.72, dir * 0.11, -0.012, 0.46, 0, 0.015, 0.48,
            /* main wing panel, rising from the fold line to the tip */
            0, 0, -0.72, dir * 0.44, 0.055, 0.4, dir * 0.11, -0.012, 0.46,
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
      const piece = createPoly(geometries[i % geometries.length].clone(), 0.28, 0.02);
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

    /* ── Pointer tracking ── */
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduced) window.addEventListener("pointermove", onPointerMove);

    /* ── Resize ── */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvasRef.current!;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      startZ = camera.aspect < 0.9 ? 6.6 : 5.5;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── Deterministic timing & easing ── */
    const SHRINK_DUR = 0.2;
    const GROW_DUR = 0.8;
    const START_TO_START_MS = 3500;
    const FIRST_DELAY_MS = 100;

    const easeInCubic = (x: number) => x * x * x;
    const easeOutBack = (x: number, s = 1.70158) => --x * x * ((s + 1) * x + s) + 1;
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

    const intervalId = reduced ? undefined : setInterval(trigger, START_TO_START_MS);
    const firstId = reduced ? undefined : setTimeout(trigger, FIRST_DELAY_MS);

    /* ── Animation loop ── */
    const clock = new THREE.Clock();
    let rafId = 0;
    const tick = () => {
      const dt = clock.getDelta();
      const elapsed = clock.elapsedTime;

      current.rotation.x += 0.01;
      current.rotation.y += 0.013;

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
      camera.position.x += (pointer.x * 0.12 * steer - camera.position.x) * 0.04;

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
        (Math.sin(elapsed * 0.55) * 0.75 + pointer.x * 0.25) * (1 - flybyW * 0.85) +
        0.02 * Math.sin(elapsed * 2.9 + 1.7) +
        0.012 * Math.sin(elapsed * 4.3) +
        orbitX;
      const swayY =
        SCENE_LIFT - 0.45 +
        (Math.sin(elapsed * 1.15 + 1) * 0.22 - pointer.y * 0.15) * (1 - flybyW * 0.6) +
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
      const yawTarget = THREE.MathUtils.clamp(-smoothVx * 1.5, -0.65, 0.65) * (1 - endW);
      const bankTarget = THREE.MathUtils.clamp(-smoothVx * 2.0, -0.7, 0.7) * (1 - endW);
      plane.rotation.y += (yawTarget - plane.rotation.y) * Math.min(dt * 3, 1);
      plane.rotation.z += (bankTarget - plane.rotation.z) * Math.min(dt * 4, 1);
      /* scrolling deeper → the dart noses over into a dive with you;
         it eases back level once the camera settles */
      const diveForward = camera.position.z - targetZ; // >0 while descending
      divePitch += (THREE.MathUtils.clamp(diveForward * 0.55, -0.12, 0.5) - divePitch) *
        Math.min(dt * 3, 1);
      plane.rotation.x =
        -0.06 -
        divePitch +
        (THREE.MathUtils.clamp(smoothVy * 0.9, -0.25, 0.25) +
          Math.sin(elapsed * 1.15 + 1) * 0.03) *
          (1 - endW);

      field.children.forEach((piece, i) => {
        piece.rotation.x += fieldSpin[i];
        piece.rotation.y += fieldSpin[i] * 1.4;
      });

      if (phase === "shrinking") {
        t = Math.min(t + dt, SHRINK_DUR);
        const p = t / SHRINK_DUR;
        const s = 1 - easeInCubic(p);
        current.scale.set(s, s, s);

        if (p === 1) {
          holder.remove(current);
          idx = (idx + 1) % geometries.length;
          current = createPoly(geometries[idx]);
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

    if (reduced) {
      renderer.render(scene, camera); // single static frame
    } else {
      rafId = requestAnimationFrame(tick);
    }

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
      if (firstId) clearTimeout(firstId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      geometries.forEach((g) => g.dispose());
      scene.traverse((obj) => {
        const o = obj as THREE.Mesh;
        o.geometry?.dispose();
        if (o.material) (o.material as THREE.Material).dispose();
      });
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [scrollYProgress]);

  return (
    <section
      ref={trackRef}
      className={`${styles.track} ${reducedMotion ? styles.trackStatic : ""}`}
    >
      <div className={styles.sticky}>
        {/* soft light source behind the solid */}
        <motion.div
          aria-hidden="true"
          style={reducedMotion ? undefined : { opacity: haloOpacity }}
          className="halo absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[min(80vw,44rem)] h-[min(80vw,44rem)]"
        />

        <motion.div
          style={reducedMotion ? undefined : { opacity: canvasOpacity }}
          className="absolute inset-0"
        >
          <canvas ref={canvasRef} className={styles.canvas} />
        </motion.div>

        <motion.div
          style={reducedMotion ? undefined : { opacity: textOpacity, scale: textScale }}
          className="absolute inset-x-0 top-[63%] flex flex-col items-center gap-6 text-center px-5"
        >
          <h1 className="font-myFont text-5xl sm:text-6xl">
            <TextReveal
              immediate
              play={introReady}
              splitBy="char"
              stagger={0.035}
              segments={[
                { text: "Hi, I’m ", className: "font-[400]" },
                { text: "Dong Li", className: "font-[700] text-indigo-500" },
              ]}
            />
          </h1>
          <motion.p
            className={`${styles.tagline} text-neutral-600`}
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={introReady ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            I love everything maths and computer science :)
          </motion.p>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          aria-hidden="true"
          style={reducedMotion ? undefined : { opacity: cueOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.span
            className="text-[0.65rem] uppercase tracking-[0.25em] text-neutral-500"
            initial={{ opacity: 0 }}
            animate={introReady ? { opacity: 1 } : {}}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            scroll
          </motion.span>
          <motion.span
            className="block w-px h-10 bg-neutral-400/60 origin-top overflow-hidden relative"
            initial={{ scaleY: 0 }}
            animate={introReady ? { scaleY: 1 } : {}}
            transition={{ delay: 1.5, duration: 0.6, ease: "easeOut" }}
          >
            {!reducedMotion && (
              <motion.span
                className="absolute left-0 top-0 w-px h-4 bg-indigo-500"
                animate={{ y: [-16, 40] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1], repeatDelay: 0.4 }}
              />
            )}
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
