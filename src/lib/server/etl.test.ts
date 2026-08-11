import { describe, it, expect } from 'vitest';
import {
	validateSnapshot,
	condenseTournament,
	buildDistribution,
	mapTier,
	displayName
} from './etl';
import type { Player, RankingsSnapshot, TournamentArchive } from '$lib/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build a `results` payload from compact match tuples [roundId, p1, p2, winnerId]. */
function draw(matches: [number, number, number, number | null][]) {
	return {
		data: {
			singles: matches.map(([roundId, player1Id, player2Id, match_winner]) => ({
				roundId,
				player1Id,
				player2Id,
				match_winner,
				date: '2024-05-20'
			}))
		}
	};
}

function player(over: Partial<Player> = {}): Player {
	return {
		rank: 1,
		name: 'Test Player',
		country: 'Italy',
		country_code: 'IT',
		current_points: 5000,
		points_distribution: Array.from({ length: 9 }, () => ({
			event_name: 'Event',
			event_type: '250',
			event_date_start: '2025-09-01',
			event_date_end: '2025-09-07',
			result: 'QF',
			points_earned: 50
		})),
		...over
	};
}

function snapshot(players: Player[]): RankingsSnapshot {
	return { updated_at: '2026-08-10T00:00:00Z', source: 'test', players };
}

const OLD = '2020-01-06'; // >28d ago → condense marks the tournament finished

// ─── condenseTournament ──────────────────────────────────────────────────────

describe('condenseTournament', () => {
	it('labels a 32-draw (R32/R16/QF/SF/F/W) and flags the champion', () => {
		// rounds present: 4=R32, 5=R16, 9=QF, 10=SF, 12=F. IDs: 1 champ … 5 out in R32.
		const a = condenseTournament('atp', { id: 1, name: 'Test 250', date: OLD, tier: 'ATP 250' },
			draw([
				[4, 5, 6, 6], // R32: 5 loses
				[5, 4, 6, 4], // R16: 4 loses (to 6? winner 4 advances) — 6 out at R16
				[9, 3, 4, 4], // QF: 3 loses
				[10, 2, 4, 4], // SF: 2 loses
				[12, 1, 4, 1] // F: 1 beats 4 → champion
			])
		);
		expect(a.status).toBe('finished');
		expect(a.players[1].result).toBe('W');
		expect(a.players[1].champion).toBe(true);
		expect(a.players[4].result).toBe('F');
		expect(a.players[2].result).toBe('SF');
		expect(a.players[3].result).toBe('QF');
		expect(a.players[6].result).toBe('R16');
		expect(a.players[5].result).toBe('R32');
	});

	it('marks a player still in the draw as alive (match_winner null), loser as not', () => {
		const recent = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
		const a = condenseTournament('atp', { id: 2, name: 'Live 250', date: recent, tier: 'ATP 250' },
			draw([
				[9, 10, 11, null], // QF in progress → both alive
				[5, 10, 12, 10] // R16: 10 beat 12 → 12 eliminated
			])
		);
		expect(a.status).toBe('ongoing'); // no final + recent start
		expect(a.players[10].alive).toBe(true);
		expect(a.players[11].alive).toBe(true);
		expect(a.players[12].alive).toBe(false);
	});

	it('returns no players for an empty/glitch draw (so the caller can skip it)', () => {
		const a = condenseTournament('atp', { id: 3, name: 'Broken', date: OLD, tier: 'ATP 250' }, { data: { singles: [] } });
		expect(Object.keys(a.players)).toHaveLength(0);
	});
});

// ─── buildDistribution ───────────────────────────────────────────────────────

describe('buildDistribution', () => {
	const finished: TournamentArchive = {
		tour_id: 1, tour: 'atp', name: 'Rome', tier: 'ATP Masters 1000', event_type: '1000',
		start_date: '2025-05-04', end_date: '2025-05-17', status: 'finished',
		players: { 100: { deepest: 12, champion: true, result: 'W', alive: true } }
	};
	const ongoing: TournamentArchive = {
		tour_id: 2, tour: 'atp', name: 'Cincinnati', tier: 'ATP Masters 1000', event_type: '1000',
		start_date: '2025-08-04', end_date: '2025-08-18', status: 'ongoing',
		players: { 100: { deepest: 10, champion: false, result: 'SF', alive: false } }
	};

	it('pivots a player, sorts by start date, and prices from the points table', () => {
		const dist = buildDistribution(100, 'atp', [ongoing, finished]);
		expect(dist.map((d) => d.event_name)).toEqual(['Rome', 'Cincinnati']); // sorted by start
		expect(dist[0].points_earned).toBe(1000); // 1000-level W
	});

	it('tags ongoing entries live + out(=eliminated) and leaves finished ones plain', () => {
		const [rome, cincy] = buildDistribution(100, 'atp', [ongoing, finished]);
		expect(rome.live).toBeUndefined();
		expect(cincy.live).toBe(true);
		expect(cincy.out).toBe(true); // alive:false → out
	});

	it('returns nothing for a player not in any archive', () => {
		expect(buildDistribution(999, 'atp', [finished, ongoing])).toHaveLength(0);
	});
});

// ─── validateSnapshot (the data-quality gate) ────────────────────────────────

describe('validateSnapshot', () => {
	it('accepts a healthy snapshot', () => {
		expect(validateSnapshot(snapshot(Array.from({ length: 100 }, () => player())))).toEqual([]);
	});

	it('rejects an empty snapshot (bug 2: empty ranking)', () => {
		expect(validateSnapshot(snapshot([])).length).toBeGreaterThan(0);
	});

	it('rejects collapsed distributions (bug 1: truncated calendar)', () => {
		// 100 players but only 4 bars each = 400 total < floor.
		const thin = player({ points_distribution: Array.from({ length: 4 }, () => player().points_distribution[0]) });
		const problems = validateSnapshot(snapshot(Array.from({ length: 100 }, () => thin)));
		expect(problems.join()).toMatch(/collapsed/);
	});

	it('rejects a malformed player row', () => {
		const players = Array.from({ length: 100 }, () => player());
		players[7] = player({ name: '' });
		expect(validateSnapshot(snapshot(players)).join()).toMatch(/malformed/);
	});

	it('rejects a points scale error (e.g. an erroneous /100 on WTA)', () => {
		// top player with 86 pts instead of ~8600 → scale looks wrong
		const players = Array.from({ length: 100 }, () => player({ current_points: 86 }));
		expect(validateSnapshot(snapshot(players)).join()).toMatch(/scale/);
	});
});

// ─── displayName (legal → common name overrides) ─────────────────────────────

describe('displayName', () => {
	it('maps a legal name to the common one and passes others through', () => {
		expect(displayName('Cori Gauff')).toBe('Coco Gauff');
		expect(displayName('Aryna Sabalenka')).toBe('Aryna Sabalenka');
	});
});

// ─── mapTier ─────────────────────────────────────────────────────────────────

describe('mapTier', () => {
	it('classifies tiers and treats unknowns as Other', () => {
		expect(mapTier('Grand Slam')).toBe('Grand Slam');
		expect(mapTier('ATP Masters 1000')).toBe('1000');
		expect(mapTier('WTA 500')).toBe('500');
		expect(mapTier('ATP 250')).toBe('250');
		expect(mapTier('Challenger 125')).toBe('Other');
		expect(mapTier(undefined)).toBe('Other');
	});
});
