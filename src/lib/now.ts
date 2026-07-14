/**
 * App clock with a dev-time override.
 *
 * SIM_NOW freezes "now" so time-dependent visuals (rolling 52-week window,
 * expiry, the live in-progress tournament bar) can be built and tested as if
 * we were at a specific moment.
 *
 * Currently simulating mid-Wimbledon 2026 (day 10 of the fortnight) so the
 * live-bar UI is exercisable: Wimbledon 2025 points (drop Mon 2026-07-13)
 * are still standing, and the anniversary window straddles "today".
 *
 * Set to `null` to use the real clock.
 */
export const SIM_NOW: string | null = null;

export function getNow(): Date {
	return SIM_NOW ? new Date(SIM_NOW) : new Date();
}
