export type EventType = 'Grand Slam' | '1000' | '500' | '250' | 'Other';
export type MatchResult = 'W' | 'F' | 'SF' | 'QF' | 'R16' | 'R32' | 'R64';

export interface TournamentResult {
	event_name: string;
	event_type: EventType;
	event_date_start: string;
	event_date_end: string;
	result: MatchResult;
	points_earned: number;
	/**
	 * True when this entry comes from a tournament still in progress (source
	 * archive `status: 'ongoing'`). `result`/`points_earned` are the player's
	 * furthest round *so far* — a floor, not a final. The chart renders these in
	 * the separate live pane instead of as a normal completed bar. Absent = finished.
	 */
	live?: boolean;
	/**
	 * For a `live` entry only: true once the player is OUT of the event (lost
	 * their deepest match), so `points_earned` is now final rather than a floor.
	 * Absent/false means still alive (advancing, or a match in play). Distinct
	 * from whether the *event* is over — a player can be eliminated while the
	 * tournament continues. Only set on next refresh; absent on pre-refresh data.
	 */
	out?: boolean;
}

export interface Player {
	rank: number;
	name: string;
	country: string;
	country_code: string;
	current_points: number;
	points_distribution: TournamentResult[];
}

export type Tour = 'atp' | 'wta';

export interface RankingsSnapshot {
	updated_at: string;
	source: 'stub' | 'rapidapi-tennisapi1' | string;
	players: Player[];
}

/**
 * Immutable per-tournament record — the archive seed for time-navigable history.
 * Written once by the ETL; never deleted. Keyed by the API's tournament/season id.
 */
export interface TournamentArchive {
	tour_id: number;
	tour: Tour;
	name: string;
	tier: string;
	event_type: EventType;
	start_date: string;
	end_date: string;
	status: 'finished' | 'ongoing';
	/**
	 * playerId → furthest round reached. `result` is the draw-size-aware label
	 * (computed at condense time, when the full draw is known); `deepest` keeps the
	 * raw roundId so derivation can be revisited without re-fetching. `alive` = the
	 * player won (or hasn't yet finished) their deepest match — meaningful only for
	 * an `ongoing` archive, where false = eliminated with the event still running.
	 */
	players: Record<number, { deepest: number; champion: boolean; result: MatchResult; alive: boolean }>;
}
