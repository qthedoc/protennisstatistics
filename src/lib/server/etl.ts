/**
 * Offline ETL — tournament-centric ranking builder.
 *
 * Runs from a Node script (`npm run refresh:data`), NOT per request: a full first
 * build is ~60 tournament fetches per tour (~70s) which busts a serverless timeout.
 *
 * Flow:
 *   1. calendar(year) + calendar(year-1) → all tournaments, filter to tour-level events
 *      ending inside the rolling 12-month window.
 *   2. per tournament: one `results` call → full draw with `match_winner` + `roundId`.
 *      Condense to { playerId → furthest round } and cache as an immutable archive file.
 *      Finished tournaments are never re-fetched (they can't change).
 *   3. ranking(tour) → official rank + total points + the player set we care about.
 *   4. pivot the archive on playerId → each player's 12-month points distribution.
 *
 * Reads `process.env.RAPIDAPI_KEY` (NOT SvelteKit's $env — this runs outside the app).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	EventType,
	MatchResult,
	Player,
	RankingsSnapshot,
	TournamentArchive,
	TournamentResult,
	Tour
} from '$lib/types';

const RAPIDAPI_HOST = 'tennis-api-atp-wta-itf.p.rapidapi.com';
const REQ_INTERVAL_MS = 1100;
const MAX_RETRIES = 3;
const WINDOW_DAYS = 364;
const TOP_N = 100;
const ARCHIVE_DIR = join(process.cwd(), 'static', 'data', 'archive');
const DATA_DIR = join(process.cwd(), 'static', 'data');

type CalendarEntry = {
	id: number;
	name: string;
	date: string; // tournament start, ISO
	tier: string;
};

export type RefreshOptions = {
	apiKey?: string;
	/** re-fetch even archived finished tournaments (for backfills / schema changes) */
	force?: boolean;
	log?: (msg: string) => void;
};

export async function refreshTour(tour: Tour, opts: RefreshOptions = {}): Promise<RankingsSnapshot> {
	const apiKey = opts.apiKey ?? process.env.RAPIDAPI_KEY;
	if (!apiKey) throw new Error('RAPIDAPI_KEY missing — set it in .env');
	const log = opts.log ?? (() => {});
	const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': RAPIDAPI_HOST };

	const now = Date.now();
	const windowStartMs = now - WINDOW_DAYS * 864e5;

	// 1. tournaments in window (current + previous calendar year), tour-level only
	const year = new Date().getUTCFullYear();
	const calendars = [
		...(await fetchCalendar(tour, year, headers)),
		...(await fetchCalendar(tour, year - 1, headers))
	];
	const candidates = calendars.filter((c) => {
		if (mapTier(c.tier) === 'Other') return false; // skip futures / challengers
		const startMs = Date.parse(c.date);
		// include anything that *started* up to ~3wk before the window opens (could end inside it)
		return startMs >= windowStartMs - 21 * 864e5 && startMs <= now + 864e5;
	});
	log(`[${tour}] ${candidates.length} tour-level tournaments in window`);

	// 2. fetch/condense each tournament (skip finished ones already archived)
	const archives: TournamentArchive[] = [];
	for (const c of candidates) {
		let archive = opts.force ? null : await readArchive(tour, c.id);
		if (!archive || archive.status !== 'finished') {
			try {
				const resultsJson = await fetchResults(tour, c.id, headers);
				archive = condenseTournament(tour, c, resultsJson);
				await writeArchive(archive);
				log(`[${tour}] fetched ${c.name} (${archive.status})`);
			} catch (err) {
				log(`[${tour}] FAILED ${c.name} (${c.id}): ${(err as Error).message}`);
				if (archive) archives.push(archive); // keep stale copy if we had one
				continue;
			}
		}
		archives.push(archive);
	}

	// keep only tournaments that actually ended inside the rolling window
	const inWindow = archives.filter((a) => Date.parse(a.end_date) >= windowStartMs);

	// 3. official ranking (rank + total points + player identity)
	const ranking = await fetchRanking(tour, headers);

	// 4. pivot archive → per-player distribution
	const ptsScale = tour === 'wta' ? 100 : 1;
	const players: Player[] = [];
	for (const row of ranking.slice(0, TOP_N)) {
		const pid = row.player?.id;
		const name = row.player?.name;
		if (pid == null || !name) continue;
		const acr3 = row.player?.countryAcr ?? '';
		players.push({
			rank: row.position ?? 0,
			name,
			country: COUNTRY_NAME[acr3] ?? acr3,
			country_code: ISO3_TO_ISO2[acr3] ?? acr3,
			current_points: Math.round((row.pts ?? 0) / ptsScale),
			points_distribution: buildDistribution(pid, tour, inWindow)
		});
	}

	return {
		updated_at: new Date().toISOString(),
		source: 'rapidapi-tennis-api-atp-wta-itf',
		players
	};
}

function buildDistribution(
	playerId: number,
	tour: Tour,
	archives: TournamentArchive[]
): TournamentResult[] {
	const out: TournamentResult[] = [];
	for (const a of archives) {
		const entry = a.players[playerId];
		if (!entry) continue;
		const points = POINTS_TABLE[tour][a.event_type][entry.result] ?? 0;
		out.push({
			event_name: a.name,
			event_type: a.event_type,
			event_date_start: a.start_date,
			event_date_end: a.end_date,
			result: entry.result,
			points_earned: points
		});
	}
	return out.sort((x, y) => x.event_date_start.localeCompare(y.event_date_start));
}

// ─── condense ──────────────────────────────────────────────────────────────

function condenseTournament(
	tour: Tour,
	meta: CalendarEntry,
	resultsJson: any
): TournamentArchive {
	const singles: any[] = resultsJson?.data?.singles ?? [];
	const raw: Record<number, { deepest: number; champion: boolean }> = {};
	const earlyRounds = new Set<number>(); // pre-QF rounds present in THIS draw
	let endMs = Date.parse(meta.date);
	let hasFinal = false;

	for (const m of singles) {
		const mMs = m.date ? Date.parse(m.date) : 0;
		if (mMs > endMs) endMs = mMs;
		if (m.roundId === 12) hasFinal = true;
		if (!isMainDrawRound(m.roundId)) continue;
		if (m.roundId <= 7) earlyRounds.add(m.roundId);

		for (const pid of [m.player1Id, m.player2Id]) {
			if (pid == null) continue;
			const cur = raw[pid];
			if (!cur || roundDepth(m.roundId) > roundDepth(cur.deepest)) {
				raw[pid] = { deepest: m.roundId, champion: cur?.champion ?? false };
			}
		}
		// champion = won the final
		if (m.roundId === 12 && m.match_winner != null) {
			raw[m.match_winner] = { deepest: 12, champion: true };
		}
	}

	// resolve draw-size-aware labels, then store per player
	const labelFor = roundLabeler(earlyRounds);
	const players: TournamentArchive['players'] = {};
	for (const [pid, e] of Object.entries(raw)) {
		const result = labelFor(e.deepest, e.champion);
		if (!result) continue;
		players[+pid] = { deepest: e.deepest, champion: e.champion, result };
	}

	const startOld = Date.now() - Date.parse(meta.date) > 28 * 864e5;
	return {
		tour_id: meta.id,
		tour,
		name: cleanName(meta.name),
		tier: meta.tier,
		event_type: mapTier(meta.tier),
		start_date: toISODate(meta.date),
		end_date: toISODate(new Date(endMs).toISOString()),
		status: hasFinal || startOld ? 'finished' : 'ongoing',
		players
	};
}

// ─── HTTP ──────────────────────────────────────────────────────────────────

async function fetchCalendar(
	tour: Tour,
	year: number,
	headers: Record<string, string>
): Promise<CalendarEntry[]> {
	// pageSize is required to get the whole year — the default returns only ~11 events.
	const res = await rateLimitedFetch(
		`https://${RAPIDAPI_HOST}/tennis/v2/${tour}/tournament/calendar/${year}?page=1&pageSize=2000`,
		{ headers }
	);
	if (!res.ok) throw new Error(`calendar ${year} ${res.status}`);
	const json = await res.json();
	const arr: any[] = Array.isArray(json) ? json : (json.data ?? []);
	return arr.map((t) => ({ id: t.id, name: t.name, date: t.date, tier: t.tier }));
}

async function fetchResults(
	tour: Tour,
	tourId: number,
	headers: Record<string, string>
): Promise<any> {
	const res = await rateLimitedFetch(
		`https://${RAPIDAPI_HOST}/tennis/v2/${tour}/tournament/results/${tourId}`,
		{ headers }
	);
	if (!res.ok) throw new Error(`results ${tourId} ${res.status}`);
	return res.json();
}

async function fetchRanking(tour: Tour, headers: Record<string, string>): Promise<any[]> {
	const date = mostRecentMonday();
	const res = await rateLimitedFetch(
		`https://${RAPIDAPI_HOST}/tennis/v2/ms-api/ranking/${tour}?date=${date}&group=singles`,
		{ headers }
	);
	if (!res.ok) throw new Error(`ranking ${res.status}: ${await res.text()}`);
	const json = await res.json();
	return Array.isArray(json) ? json : (json.data ?? []);
}

let lastReqAt = 0;
async function rateLimitedFetch(url: string, init: RequestInit): Promise<Response> {
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		const wait = Math.max(0, lastReqAt + REQ_INTERVAL_MS - Date.now());
		if (wait > 0) await new Promise((r) => setTimeout(r, wait));
		lastReqAt = Date.now();
		const res = await fetch(url, init);
		if (res.status !== 429) return res;
		await new Promise((r) => setTimeout(r, REQ_INTERVAL_MS * 2 ** attempt));
	}
	throw new Error(`rate limited after ${MAX_RETRIES} retries: ${url}`);
}

// ─── archive io ──────────────────────────────────────────────────────────────

function archivePath(tour: Tour, tourId: number): string {
	return join(ARCHIVE_DIR, tour, `${tourId}.json`);
}

async function readArchive(tour: Tour, tourId: number): Promise<TournamentArchive | null> {
	try {
		return JSON.parse(await readFile(archivePath(tour, tourId), 'utf-8')) as TournamentArchive;
	} catch {
		return null;
	}
}

async function writeArchive(a: TournamentArchive): Promise<void> {
	await mkdir(join(ARCHIVE_DIR, a.tour), { recursive: true });
	await writeFile(archivePath(a.tour, a.tour_id), JSON.stringify(a), 'utf-8');
}

export async function writeSnapshot(tour: Tour, snapshot: RankingsSnapshot): Promise<void> {
	await mkdir(DATA_DIR, { recursive: true });
	await writeFile(join(DATA_DIR, `${tour}.json`), JSON.stringify(snapshot, null, 2), 'utf-8');
}

// ─── derivation ──────────────────────────────────────────────────────────────

function isMainDrawRound(id: number): boolean {
	return [4, 5, 6, 7, 9, 10, 12, 24].includes(id);
}

function roundDepth(id: number): number {
	if (id === 12) return 7;
	if (id === 10) return 6;
	if (id === 9 || id === 24) return 5;
	if (id === 7) return 4;
	if (id === 6) return 3;
	if (id === 5) return 2;
	if (id === 4) return 1;
	return 0;
}

/**
 * Round ids are *relative* ordinals ("First/Second/Third/Fourth round"), so their real
 * label depends on draw size: a 32-draw's "Second round" is R16, a slam's is R64.
 * Map the pre-QF rounds actually present in this draw to R16/R32/R64 from the deepest down.
 *   slam   {4,5,6,7} → 7=R16, 6=R32, 5=R64, 4=R64(R128 collapsed)
 *   32-draw {4,5}    → 5=R16, 4=R32
 */
function roundLabeler(earlyRounds: Set<number>): (roundId: number, champion: boolean) => MatchResult | null {
	const ordered = [...earlyRounds].sort((a, b) => b - a); // 7,6,5,4
	const LABELS: MatchResult[] = ['R16', 'R32', 'R64', 'R64'];
	const early = new Map<number, MatchResult>();
	ordered.forEach((rid, i) => early.set(rid, LABELS[Math.min(i, LABELS.length - 1)]));
	return (roundId, champion) => {
		if (roundId === 12) return champion ? 'W' : 'F';
		if (roundId === 10) return 'SF';
		if (roundId === 9 || roundId === 24) return 'QF';
		return early.get(roundId) ?? null;
	};
}

// The calendar's `tier` is rich enough to classify directly, e.g. "Grand Slam",
// "ATP Masters 1000", "ATP 500", "ATP 250", "WTA 1000", "Finals". No 250-vs-500 guessing.
function mapTier(tier: string | undefined): EventType {
	const t = (tier ?? '').toLowerCase();
	if (t.includes('grand slam')) return 'Grand Slam';
	if (t.includes('masters') || t.includes('1000')) return '1000';
	if (t.includes('finals')) return '1000';
	if (t.includes('500')) return '500';
	if (t.includes('250')) return '250';
	return 'Other'; // Future, Challenger, Davis/Billie Jean King Cup, Olympics, etc.
}

function cleanName(name: string | undefined): string {
	if (!name) return '';
	return name.split(' - ')[0].trim();
}

function toISODate(iso: string | undefined): string {
	if (!iso) return '';
	return iso.slice(0, 10);
}

function mostRecentMonday(): string {
	const d = new Date();
	const day = d.getUTCDay();
	const diff = day === 0 ? 6 : day - 1;
	d.setUTCDate(d.getUTCDate() - diff);
	const dd = String(d.getUTCDate()).padStart(2, '0');
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

const POINTS_TABLE: Record<Tour, Record<EventType, Partial<Record<MatchResult, number>>>> = {
	atp: {
		'Grand Slam': { W: 2000, F: 1300, SF: 800, QF: 400, R16: 200, R32: 100, R64: 50 },
		'1000': { W: 1000, F: 650, SF: 400, QF: 200, R16: 100, R32: 50, R64: 30 },
		'500': { W: 500, F: 330, SF: 200, QF: 100, R16: 50, R32: 25 },
		'250': { W: 250, F: 165, SF: 100, QF: 50, R16: 25 },
		Other: {}
	},
	wta: {
		'Grand Slam': { W: 2000, F: 1300, SF: 780, QF: 430, R16: 240, R32: 130, R64: 70 },
		'1000': { W: 1000, F: 650, SF: 390, QF: 215, R16: 120, R32: 65, R64: 10 },
		'500': { W: 500, F: 325, SF: 195, QF: 108, R16: 60 },
		'250': { W: 250, F: 163, SF: 98, QF: 54, R16: 30 },
		Other: {}
	}
};

const ISO3_TO_ISO2: Record<string, string> = {
	ITA: 'IT', ESP: 'ES', GER: 'DE', SRB: 'RS', RUS: 'RU', NOR: 'NO', GRE: 'GR',
	BUL: 'BG', USA: 'US', BLR: 'BY', POL: 'PL', KAZ: 'KZ', CHN: 'CN', CZE: 'CZ',
	FRA: 'FR', GBR: 'GB', AUS: 'AU', CAN: 'CA', ARG: 'AR', BRA: 'BR', CHI: 'CL',
	URU: 'UY', NED: 'NL', BEL: 'BE', SUI: 'CH', AUT: 'AT', POR: 'PT', SWE: 'SE',
	DEN: 'DK', FIN: 'FI', JPN: 'JP', KOR: 'KR', TPE: 'TW', IND: 'IN', RSA: 'ZA',
	UKR: 'UA', LAT: 'LV', LTU: 'LT', EST: 'EE', SVK: 'SK', SLO: 'SI', CRO: 'HR',
	BIH: 'BA', ROU: 'RO', HUN: 'HU', GEO: 'GE', MEX: 'MX', COL: 'CO', PER: 'PE',
	TUN: 'TN', MAR: 'MA', EGY: 'EG', ISR: 'IL', NZL: 'NZ'
};

const COUNTRY_NAME: Record<string, string> = {
	ITA: 'Italy', ESP: 'Spain', GER: 'Germany', SRB: 'Serbia', RUS: 'Russia',
	NOR: 'Norway', GRE: 'Greece', BUL: 'Bulgaria', USA: 'United States', BLR: 'Belarus',
	POL: 'Poland', KAZ: 'Kazakhstan', CHN: 'China', CZE: 'Czech Republic', FRA: 'France',
	GBR: 'United Kingdom', AUS: 'Australia', CAN: 'Canada', ARG: 'Argentina', BRA: 'Brazil',
	CHI: 'Chile', URU: 'Uruguay', NED: 'Netherlands', BEL: 'Belgium', SUI: 'Switzerland',
	AUT: 'Austria', POR: 'Portugal', SWE: 'Sweden', DEN: 'Denmark', FIN: 'Finland',
	JPN: 'Japan', KOR: 'South Korea', TPE: 'Taiwan', IND: 'India', RSA: 'South Africa',
	UKR: 'Ukraine', LAT: 'Latvia', LTU: 'Lithuania', EST: 'Estonia', SVK: 'Slovakia',
	SLO: 'Slovenia', CRO: 'Croatia', BIH: 'Bosnia & Herzegovina', ROU: 'Romania',
	HUN: 'Hungary', GEO: 'Georgia', MEX: 'Mexico', COL: 'Colombia', PER: 'Peru',
	TUN: 'Tunisia', MAR: 'Morocco', EGY: 'Egypt', ISR: 'Israel', NZL: 'New Zealand'
};
