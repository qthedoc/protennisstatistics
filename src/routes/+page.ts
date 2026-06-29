import type { PageLoad } from './$types';
import type { RankingsSnapshot } from '$lib/types';

export const prerender = true;

export const load: PageLoad = async ({ fetch }) => {
	const [atpRes, wtaRes] = await Promise.all([
		fetch('/data/atp.json'),
		fetch('/data/wta.json'),
	]);
	const [atp, wta]: [RankingsSnapshot, RankingsSnapshot] = await Promise.all([
		atpRes.json(),
		wtaRes.json(),
	]);
	return {
		atpPlayer: atp.players[0],
		wtaPlayer: wta.players[0],
	};
};
