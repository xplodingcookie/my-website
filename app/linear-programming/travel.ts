// Shared pacing for everything that follows the Simplex walk: the plot marker
// and the numeric readouts derive their keyframe timing from one plan, so the
// numbers roll exactly as fast as the dot travels.
export const PLOT_SPAN = 220; // drawable viewBox pixels across the plot
const SPEED = 400; // viewBox pixels per second

export type TravelPlan = {
  duration: number;
  times: number[];
  ease: "linear" | "easeInOut";
  total: number;
};

// `scale` converts the given coordinates to viewBox pixels (1 when the points
// are already projected). `pace` stretches the result: it is the playback
// delay as a multiple of the default, so the Speed control slows or quickens
// the sweep exactly as it slows or quickens the pause between vertices.
// Single edges ease into their vertex; longer runs cruise at constant speed.
export function travelPlan(
  points: number[][],
  scale = 1,
  pace = 1,
): TravelPlan | null {
  if (points.length < 2) return null;
  const cum = [0];
  for (let i = 1; i < points.length; i++)
    cum.push(
      cum[i - 1] +
        Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]) *
          scale,
    );
  const total = cum[cum.length - 1];
  if (total < 1e-6) return null;
  return {
    total,
    duration: Math.min(2.2, Math.max(0.18, total / SPEED)) * pace,
    times: cum.map((c) => c / total),
    ease: points.length > 3 ? "linear" : "easeInOut",
  };
}
