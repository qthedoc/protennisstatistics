export type EventType = 'Grand Slam' | '1000' | '500' | '250' | 'Other';
export type MatchResult = 'W' | 'F' | 'SF' | 'QF' | 'R16' | 'R32' | 'R64';

export interface TournamentResult {
	event_name: string;
	event_type: EventType;
	event_date_start: string;
	event_date_end: string;
	result: MatchResult;
	points_earned: number;
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
	 * raw roundId so derivation can be revisited without re-fetching.
	 */
	players: Record<number, { deepest: number; champion: boolean; result: MatchResult }>;
}
