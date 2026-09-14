"use client";
import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    let cleanup: (() => void) | undefined;
    const setup = () => {
      cleanup?.();
      cleanup = undefined;
      if (reduced.matches || coarse.matches) return;
      const lenis = new Lenis({ lerp: 0.12 });
      window.__lenis = lenis;
      let frame = requestAnimationFrame(function raf(time) {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      });
      cleanup = () => {
        cancelAnimationFrame(frame);
        lenis.destroy();
        delete window.__lenis;
      };
    };
    // A press has to land on a still page. Lenis keeps easing for a beat after
    // the wheel stops, so a control can glide out from under the cursor and the
    // grab is dropped — most visibly the Speed slider on the Simplex walk,
    // where the whole drag is lost, not just a click. stop() resyncs the target
    // to the real scroll position and kills the in-flight tail; start() hands
    // scrolling straight back, so smooth scrolling is never left switched off.
    const settle = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("input, button, select, textarea, summary, a[href]"))
        return;
      window.__lenis?.stop();
      window.__lenis?.start();
    };
    const onAnchor = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (
        !link ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.classList.contains("skip-link")
      )
        return;
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        !url.hash
      )
        return;
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", url.hash);
      const focus = () => {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      };
      const top =
        target.id === "top"
          ? 0
          : target.getBoundingClientRect().top + window.scrollY - 104;
      if (window.__lenis && !reduced.matches)
        window.__lenis.scrollTo(top, { duration: 1.05, onComplete: focus });
      else {
        window.scrollTo({ top, behavior: "instant" });
        focus();
      }
    };
    setup();
    window.addEventListener("pointerdown", settle, true);
    window.addEventListener("click", onAnchor);
    reduced.addEventListener("change", setup);
    coarse.addEventListener("change", setup);
    return () => {
      cleanup?.();
      window.removeEventListener("pointerdown", settle, true);
      window.removeEventListener("click", onAnchor);
      reduced.removeEventListener("change", setup);
      coarse.removeEventListener("change", setup);
    };
  }, []);
  return null;
}
