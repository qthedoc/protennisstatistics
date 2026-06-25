<script lang="ts">
	import PlayerRow from '$lib/components/PlayerRow.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const players = $derived(data.snapshot.players);
</script>

<svelte:head>
	<title>ATP Rankings – Pro Tennis Statistics</title>
	<meta name="description" content="Current ATP rankings with 12-month points distribution for the top 10 players." />
</svelte:head>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<a href="/" class="text-sm text-muted-foreground hover:text-foreground">Home</a>
				<span class="text-muted-foreground/40">/</span>
				<span class="text-sm text-foreground">ATP Rankings</span>
			</div>
			<h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">ATP Rankings</h1>
			<p class="mt-1 text-sm text-muted-foreground">Rolling 12-month window · Jun 2025 – Jun 2026</p>
		</div>
		<span class="shrink-0 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
			Men's Tour
		</span>
	</div>

	<!-- Legend -->
	<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
		<span class="text-xs font-medium text-muted-foreground">Event type:</span>
		{#each [['Grand Slam', 'oklch(0.60 0.22 285)'], ['Masters 1000', 'oklch(0.52 0.20 245)'], ['500', 'oklch(0.56 0.17 160)'], ['250', 'oklch(0.70 0.15 85)']] as [label, color]}
			<div class="flex items-center gap-1.5">
				<span class="size-2.5 rounded-sm" style="background:{color}"></span>
				<span class="text-xs text-muted-foreground">{label}</span>
			</div>
		{/each}
		<div class="ml-auto hidden text-xs text-muted-foreground md:block">← older points &nbsp;|&nbsp; newer points →</div>
	</div>

	<!-- Column headers (md+) -->
	<div class="hidden grid-cols-[3rem_2fr_6rem_minmax(0,1fr)] gap-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
		<span>Rank</span>
		<span>Player</span>
		<span class="text-right">Points</span>
		<span>Points Distribution (12 months)</span>
	</div>

	<!-- Players -->
	<div class="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card/60">
		{#each players as player}
			<PlayerRow {player} />
		{/each}
	</div>

	<p class="text-center text-xs text-muted-foreground">
		Top 10 ATP players · Demo data for illustration purposes
	</p>
</div>
