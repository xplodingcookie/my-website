"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
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
    const setPolyOpacity = (group: THREE.Group, opacity: number) => {
      group.traverse((obj) => {
        const mat = (obj as THREE.LineSegments | THREE.Points).material as
          | THREE.Material
          | undefined;
        if (mat) mat.opacity = opacity;
      });
    };

    /* ── Foreground solid, inside a holder that follows the pointer ── */
    const holder = new THREE.Group();
    holder.position.y = SCENE_LIFT;
    scene.add(holder);
    let idx = 0;
    let current = createPoly(geometries[idx]);
    holder.add(current);

    /* ── Background solid: the second shell the camera flies through ── */
    const backdrop = createPoly(new THREE.IcosahedronGeometry(2.4), 0.08);
    backdrop.position.set(0, SCENE_LIFT, -4.5);
    scene.add(backdrop);

    /* ── Field: small solids scattered along the flight path so the space
       between the two shells stays alive — placed on a golden-angle spiral
       around the camera axis, never dead-centre in the way ── */
    const FIELD_COUNT = 12;
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

      backdrop.rotation.y -= 0.0012;
      backdrop.rotation.x += 0.0008;

      /* the outer shell emerges as the camera closes in on it */
      const shellDist = camera.position.z - backdrop.position.z; // ~10 far → ~0 at crossing
      const emerge = THREE.MathUtils.clamp(1 - (shellDist - 1.5) / 6, 0, 1);
      setPolyOpacity(backdrop, 0.08 + emerge * 0.2);

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
