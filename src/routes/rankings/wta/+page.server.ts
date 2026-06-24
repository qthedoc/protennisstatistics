import { getRankings } from '$lib/server/tennis-api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const snapshot = await getRankings('wta');
	setHeaders({
		'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});
	return { snapshot };
};
