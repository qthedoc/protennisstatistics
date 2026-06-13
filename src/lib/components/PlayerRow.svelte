<script lang="ts">
	import type { Player } from '$lib/types';
	import PointsBarChart from './PointsBarChart.svelte';

	let { player }: { player: Player } = $props();

	function countryFlag(code: string): string {
		return code
			.toUpperCase()
			.split('')
			.map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
			.join('');
	}

	const rankColors: Record<number, string> = {
		1: 'text-amber-500 font-bold',
		2: 'text-slate-400 font-bold',
		3: 'text-amber-700 font-bold',
	};
</script>

<div class="group grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50 md:grid-cols-[3rem_2fr_6rem_minmax(0,1fr)]">
	<!-- Rank -->
	<div class="flex size-8 items-center justify-center rounded-lg bg-muted text-sm {rankColors[player.rank] ?? 'text-muted-foreground font-medium'}">
		{player.rank}
	</div>

	<!-- Name + Country -->
	<div class="min-w-0">
		<p class="truncate text-sm font-semibold text-foreground">{player.name}</p>
		<p class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
			<span aria-label={player.country}>{countryFlag(player.country_code)}</span>
			<span>{player.country}</span>
		</p>
	</div>

	<!-- Points (hidden on small mobile, shown on md+) -->
	<div class="hidden text-right md:block">
		<p class="text-sm font-bold tabular-nums text-foreground">{player.current_points.toLocaleString()}</p>
		<p class="text-xs text-muted-foreground">pts</p>
	</div>

	<!-- Bar Chart (takes remaining space on md+, full row on mobile) -->
	<div class="col-span-3 mt-1 md:col-span-1 md:mt-0">
		<PointsBarChart results={player.points_distribution} />
	</div>
</div>
