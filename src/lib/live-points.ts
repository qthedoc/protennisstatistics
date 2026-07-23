/**
 * Live-points math — shared by the chart (PointsBarChart) and the ranking-row
 * columns (PlayerRow) so the two can never disagree on what's "live", what's
 * being "defended", or the derived live total.
 *
 * There is NO official "live ranking" API endpoint (the API exposes only
 * singles/doubles/race/surface/prize; `race` is calendar-YTD, not a live
 * ranking). Every site derives live rankings the same way, and so do we:
 *
 *     live_points = current_points − defending_points + live_earned
 *
 * where `live_earned` is the points a player has locked in at the in-progress
 * event so far (a floor) and `defending_points` is what last year's edition of
 * that same event still contributes to the official total (dropping when this
 * year's points are awarded). No new API calls — every input is already in the
 * player's `points_distribution`.
 */

import type { Player, TournamentResult } from '$lib/types';
import { getNow } from '$lib/now';

const MS_DAY = 86_400_000;

/**
 * Parse a YYYY-MM-DD string as LOCAL noon. Date-only strings parse as UTC
 * midnight, which shifts the calendar day in negative-offset timezones and
 * breaks day-of-week / month-day math.
 */
export function localDate(dateStr: string): Date {
	return new Date(dateStr + 'T12:00:00');
}

/** Monday on or after a given date (the ATP points-award anchor). */
function mondayOnOrAfter(d: Date): Date {
	const day = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
	const offset = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
	return new Date(d.getTime() + offset * MS_DAY);
}

/**
 * A result is visible until 52 weeks after the Monday on-or-after its end date
 * (points are awarded that Monday and expire exactly 52 weeks later, dropping at
 * the start of the expiry Monday). Mirrors how ATP ranking points work.
 */
function isVisible(r: TournamentResult, now: Date): boolean {
	const expiry = mondayOnOrAfter(localDate(r.event_date_end));
	expiry.setDate(expiry.getDate() + 364); // 52 weeks after award Monday
	expiry.setHours(0, 0, 0, 0); // drop at the start of that Monday
	return now < expiry;
}

/** The subset of a player's results whose points have not yet expired. */
export function visibleResults(results: TournamentResult[], now = getNow()): TournamentResult[] {
	return results.filter((r) => isVisible(r, now));
}

/** The in-progress tournament, flagged `live` by the ETL from an ongoing draw. */
export function findLive(results: TournamentResult[]): TournamentResult | null {
	return results.find((r) => r.live) ?? null;
}

/** Every in-progress tournament in the loaded field, by name (dedup). */
export function ongoingEventNames(players: Player[], now = getNow()): Set<string> {
	const names = new Set<string>();
	for (const p of players) {
		for (const r of visibleResults(p.points_distribution, now)) {
			if (r.live) names.add(r.event_name);
		}
	}
	return names;
}

/**
 * The prior-year edition of an in-progress event whose still-standing points the
 * player is defending — i.e. a non-live visible result at a tournament running
 * right now. With `ongoingNames` (the whole field's live events) this catches a
 * player defending points at an event they DIDN'T re-enter; without it, it falls
 * back to only the event the player is themselves playing (name-matched to
 * `live`), which is what the chart wants.
 */
export function findDefending(
	results: TournamentResult[],
	live: TournamentResult | null,
	ongoingNames?: Set<string>
): TournamentResult | null {
	// Only points actually at risk count as "defending" — a 0-point prior result
	// (entered, lost early) defends nothing and would just be noise.
	if (ongoingNames) {
		// prefer the edition of the event the player is actively contesting…
		if (live) {
			const own = results.find(
				(r) => !r.live && r.points_earned > 0 && r.event_name === live.event_name
			);
			if (own) return own;
		}
		// …otherwise any prior result at a tournament running now (not re-entered).
		return (
			results.find((r) => !r.live && r.points_earned > 0 && ongoingNames.has(r.event_name)) ?? null
		);
	}
	if (!live) return null;
	return (
		results.find((r) => !r.live && r.points_earned > 0 && r.event_name === live.event_name) ?? null
	);
}

export interface LivePoints {
	/** The in-progress tournament entry, or null when the player isn't playing. */
	live: TournamentResult | null;
	/**
	 * True when the player is STILL IN the live event (advancing / a match in
	 * play) — drives the breathing "still playing" dot. False when they've been
	 * eliminated (result final) or there's no live entry. Requires the ETL `out`
	 * flag; pre-refresh data lacks it, so this reads false there (no dot until a
	 * refresh, rather than a misleading dot).
	 */
	liveIn: boolean;
	/**
	 * Prior-year edition of an event running now whose points are being defended,
	 * or null. Independent of `live` — a player not re-entered still defends (and
	 * loses) last year's points as the event plays out.
	 */
	defending: TournamentResult | null;
	/** Points locked in at the live event so far (0 when not playing). */
	liveEarned: number;
	/** Points from last year's edition currently in the official total (0 if none). */
	defendingPoints: number;
	/** current_points − defendingPoints + liveEarned. */
	livePoints: number;
	/** Net swing vs the official total: liveEarned − defendingPoints. */
	delta: number;
}

/**
 * Derive a player's live-points picture from their visible results. Pass
 * `ongoingNames` (the whole field's in-progress events) to also count points a
 * player is defending at a tournament they didn't re-enter.
 */
export function computeLive(
	player: Player,
	now = getNow(),
	ongoingNames?: Set<string>
): LivePoints {
	const vis = visibleResults(player.points_distribution, now);
	const live = findLive(vis);
	const defending = findDefending(vis, live, ongoingNames);
	const liveEarned = live?.points_earned ?? 0;
	const defendingPoints = defending?.points_earned ?? 0;
	const delta = liveEarned - defendingPoints;
	return {
		live,
		// Explicit `out === false` only — an absent flag (old data) reads as "not
		// in", so we never assert a player is still playing without evidence.
		liveIn: !!live && live.out === false,
		defending,
		liveEarned,
		defendingPoints,
		livePoints: player.current_points + delta,
		delta
	};
}

/**
 * Live rank for every player, keyed by name: re-rank the field by live points
 * (ties broken by official rank for stability). Only sees the loaded set (top
 * 100) — a surger outside it can't be counted, which is fine for the top.
 */
export function liveRanks(players: Player[], now = getNow()): Map<string, number> {
	const ongoing = ongoingEventNames(players, now);
	const scored = players.map((p) => ({
		name: p.name,
		lp: computeLive(p, now, ongoing).livePoints,
		rank: p.rank
	}));
	scored.sort((a, b) => b.lp - a.lp || a.rank - b.rank);
	const m = new Map<string, number>();
	scored.forEach((s, i) => m.set(s.name, i + 1));
	return m;
}
