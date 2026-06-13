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
