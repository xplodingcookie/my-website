// The original wireframe language remains visible while WebGL loads, or if it
// is unavailable. It occupies the same scene, without moving the introduction.
export default function HeroFallback() {
  return (
    <svg
      className="hero-wire-fallback"
      viewBox="0 0 600 600"
      aria-hidden="true"
      fill="none"
    >
      <g stroke="#655776" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M300 100L409 286L188 278ZM300 100L312 329L409 286M188 278L312 329" />
        <path
          d="M124 179L145 193L126 214L108 194ZM464 271L486 282L468 302L446 290ZM404 85L424 92L424 114L404 107ZM404 85L414 75L434 82L424 92M434 82L434 105L424 114"
          opacity=".4"
        />
      </g>
    </svg>
  );
}
