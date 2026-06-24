import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getRankings, invalidate } from '$lib/server/tennis-api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const authHeader = request.headers.get('authorization');
	const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null;

	const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
	const tokenOk = expected && authHeader === expected;
	const queryToken = env.CRON_SECRET && url.searchParams.get('token') === env.CRON_SECRET;

	if (!isVercelCron && !tokenOk && !queryToken) {
		throw error(401, 'unauthorized');
	}

	invalidate();
	const [atp, wta] = await Promise.all([getRankings('atp'), getRankings('wta')]);

	return json({
		ok: true,
		atp: { updated_at: atp.updated_at, source: atp.source, players: atp.players.length },
		wta: { updated_at: wta.updated_at, source: wta.source, players: wta.players.length }
	});
};
