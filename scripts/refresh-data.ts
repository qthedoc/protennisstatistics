/**
 * Refresh ranking snapshots from the live API.
 *
 *   npm run refresh:data              # incremental: only new / in-progress tournaments
 *   npm run refresh:data -- --force   # re-fetch everything (backfill / schema change)
 *   npm run refresh:data -- --offline # rebuild from local archives only, ZERO API calls
 *
 * Writes static/data/{atp,wta}.json (served at runtime) and grows the immutable
 * per-tournament archive under static/data/archive/. `--offline` needs a prior
 * online run to have seeded static/data/rankings/ (the id<->name join).
 */
import { refreshTour, writeSnapshot } from '../src/lib/server/etl';
import type { Tour } from '../src/lib/types';

const force = process.argv.includes('--force');
const offline = process.argv.includes('--offline');
const tours: Tour[] = ['atp', 'wta'];

const log = (msg: string) => console.log(msg);

if (offline) log('OFFLINE mode — no API calls, rebuilding from local archives.');

for (const tour of tours) {
	const started = Date.now();
	const snapshot = await refreshTour(tour, { force, offline, log });
	await writeSnapshot(tour, snapshot);
	const secs = ((Date.now() - started) / 1000).toFixed(1);
	log(`[${tour}] wrote ${snapshot.players.length} players in ${secs}s`);
}

log('done.');
