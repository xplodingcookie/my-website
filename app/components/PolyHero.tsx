'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './PolyHero.module.css';

export default function PolyHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    /* ── scene, camera, renderer ── */
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3;

    /* ── Geometries and helper ── */
    const geometries = [
      new THREE.TetrahedronGeometry(1),
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.OctahedronGeometry(1),
      new THREE.DodecahedronGeometry(1),
      new THREE.IcosahedronGeometry(1),
    ];
    const createPoly = (g: THREE.BufferGeometry) => {
      const group = new THREE.Group();
      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(g),
          new THREE.LineBasicMaterial({ color: 0x000000, transparent: true }),
        ),
      );
      group.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            color: 0x000000,
            size: 0.05,
            transparent: true,
            sizeAttenuation: true,
          }),
        ),
      );
      return group;
    };

    /* ── Initial poly ── */
    let idx = 0;
    let current = createPoly(geometries[idx]);
    scene.add(current);

    /* ── Resize ── */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvasRef.current!;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── Deterministic timing & easing ── */
    const SHRINK_DUR = 0.2;  // seconds
    const GROW_DUR   = 0.8;  // seconds
    const START_TO_START_MS = 3500; // each cycle begins every 4 s
    const FIRST_DELAY_MS    = 100;  // first shrink almost immediately

    // Cubic ease-in (faster toward end)
    const easeInCubic = (x: number) => x * x * x;

    // “Back” ease-out (overshoot, then settle) with default overshoot 1.70158
    const easeOutBack = (x: number, s = 1.70158) =>
      --x * x * ((s + 1) * x + s) + 1;

    /* ── Transition state machine ── */
    type Phase = 'idle' | 'shrinking' | 'growing';
    let phase: Phase = 'idle';
    let t = 0;               // seconds into current phase

    const trigger = () => {
      if (phase === 'idle') {
        t = 0;
        phase = 'shrinking';
      }
    };

    const intervalId = setInterval(trigger, START_TO_START_MS);
    const firstId    = setTimeout(trigger, FIRST_DELAY_MS);

    /* ── Animation loop ── */
    const clock = new THREE.Clock();
    const tick = () => {
      const dt = clock.getDelta();

      /* rotate whichever poly is visible */
      current.rotation.x += 0.01;
      current.rotation.y += 0.013;

      if (phase === 'shrinking') {
        t = Math.min(t + dt, SHRINK_DUR);
        const p = t / SHRINK_DUR;       // 0 → 1
        const s = 1 - easeInCubic(p);   // 1 → 0, accelerating
        current.scale.set(s, s, s);

        if (p === 1) {
          /* swap in next poly, scaled to 0 */
          scene.remove(current);
          idx = (idx + 1) % geometries.length;
          current = createPoly(geometries[idx]);
          current.scale.set(0, 0, 0);
          scene.add(current);

          phase = 'growing';
          t = 0;
        }
      } else if (phase === 'growing') {
        t = Math.min(t + dt, GROW_DUR);
        const p = t / GROW_DUR;         // 0 → 1
        const s = easeOutBack(p);       // 0 → 1 (+overshoot) → 1
        current.scale.set(s, s, s);

        if (p === 1) phase = 'idle';
      }

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();

    /* ── Cleanup ── */
    return () => {
      clearInterval(intervalId);
      clearTimeout(firstId);
      window.removeEventListener('resize', resize);
      geometries.forEach((g) => g.dispose());
      renderer.dispose();
    };
  }, []);


  /* ─── Mark-up ────────────────────────────────────────────────────── */
  return (
    <section className={styles.hero}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <h1 className="font-myFont text-5xl">
        <span className="font-[400]">Hi, I’m </span>
        <span className="font-[700] text-indigo-500">Dong Li</span>
      </h1>
      <p className={`${styles.tagline} px-5`}>
        I love everything maths and computer science :)
      </p>
    </section>
  );
}
