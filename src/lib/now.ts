/**
 * App clock with a dev-time override.
 *
 * SIM_NOW freezes "now" so time-dependent visuals (rolling 52-week window,
 * point expiry, the live in-progress tournament) can be built and tested as if
 * we were at a specific moment. Set to an ISO string to reproduce a live moment;
 * `null` (the default) uses the real clock.
 */
export const SIM_NOW: string | null = null;

export function getNow(): Date {
	return SIM_NOW ? new Date(SIM_NOW) : new Date();
}
