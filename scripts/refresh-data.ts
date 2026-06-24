/**
 * Refresh ranking snapshots from the live API.
 *
 *   npm run refresh:data            # incremental: only new / in-progress tournaments
 *   npm run refresh:data -- --force # re-fetch everything (backfill / schema change)
 *
 * Writes static/data/{atp,wta}.json (served at runtime) and grows the immutable
 * per-tournament archive under static/data/archive/.
 */
import { refreshTour, writeSnapshot } from '../src/lib/server/etl';
import type { Tour } from '../src/lib/types';

const force = process.argv.includes('--force');
const tours: Tour[] = ['atp', 'wta'];

const log = (msg: string) => console.log(msg);

for (const tour of tours) {
	const started = Date.now();
	const snapshot = await refreshTour(tour, { force, log });
	await writeSnapshot(tour, snapshot);
	const secs = ((Date.now() - started) / 1000).toFixed(1);
	log(`[${tour}] wrote ${snapshot.players.length} players in ${secs}s`);
}

log('done.');
