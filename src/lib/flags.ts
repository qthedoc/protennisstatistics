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
 * bars. ON since the live bar now reads real data: entries the ETL flags
 * `live` (from an ongoing tournament draw) render in the pane with the round +
 * points the player has reached so far.
 */
export const SHOW_LIVE_POINTS = true;
