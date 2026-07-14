/**
 * Hardcoded feature flags.
 *
 * Flip a flag here to toggle an in-progress feature app-wide. These are the
 * module-level defaults; components that gate on a flag also accept a matching
 * prop (defaulting to the constant), so a flag could later become a per-user
 * setting without touching the flag site — the prop just overrides the default.
 */

/**
 * Show the "live" section of the points bar chart: the separated right-edge
 * pane with the in-progress tournament's live bar, the "● SF" indicator, and
 * the reserved pane width + divider.
 *
 * OFF hides all of it and the chart reverts to just the trailing 52-week main
 * bars. Currently OFF because the live points are still placeholder data (see
 * `LIVE_PLACEHOLDER` in PointsBarChart.svelte). Flip to `true` once the live
 * feed is wired in.
 */
export const SHOW_LIVE_POINTS = false;
