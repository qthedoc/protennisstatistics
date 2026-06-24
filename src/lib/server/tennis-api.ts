/**
 * Runtime ranking access — read-only.
 *
 * Serves the pre-built snapshot from static/data/{tour}.json (produced offline by
 * `npm run refresh:data`, see src/lib/server/etl.ts). No live API calls happen on the
 * request path — a full tournament-centric build is too slow for a serverless timeout,
 * and this keeps the API key out of the runtime entirely.
 *
 * In-memory cache survives only while a function instance stays warm; the edge cache
 * (`s-maxage` in the page loads) is what actually shields the upstream data.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RankingsSnapshot, Tour } from '$lib/types';

const CACHE_TTL_MS = 60 * 60 * 1000;

type CacheEntry = { snapshot: RankingsSnapshot; expires: number };
const cache = new Map<Tour, CacheEntry>();

export function invalidate(tour?: Tour): void {
	if (tour) cache.delete(tour);
	else cache.clear();
}

export async function getRankings(tour: Tour): Promise<RankingsSnapshot> {
	const now = Date.now();
	const hit = cache.get(tour);
	if (hit && hit.expires > now) return hit.snapshot;

	const snapshot = await loadSnapshot(tour);
	cache.set(tour, { snapshot, expires: now + CACHE_TTL_MS });
	return snapshot;
}

async function loadSnapshot(tour: Tour): Promise<RankingsSnapshot> {
	const path = join(process.cwd(), 'static', 'data', `${tour}.json`);
	const raw = await readFile(path, 'utf-8');
	return JSON.parse(raw) as RankingsSnapshot;
}
