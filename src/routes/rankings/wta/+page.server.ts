import { getRankings } from '$lib/server/tennis-api';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const snapshot = await getRankings('wta');
	return { snapshot };
};
