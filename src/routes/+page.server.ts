import { getRankings } from '$lib/server/tennis-api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const tour = Math.random() < 0.5 ? 'atp' : 'wta';
	const snapshot = await getRankings(tour);
	return { topPlayer: snapshot.players[0], tour };
};
