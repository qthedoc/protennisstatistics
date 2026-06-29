import { getRankings } from '$lib/server/tennis-api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const snapshot = await getRankings('atp');
	return { topPlayer: snapshot.players[0] };
};
