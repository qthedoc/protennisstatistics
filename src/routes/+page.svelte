<svelte:head>
	<title>Pro Tennis Statistics</title>
	<meta name="description" content="Live ATP and WTA rankings with points distribution across the last 12 months." />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-10">
	<!-- Hero -->
	<div class="space-y-4 pt-4">
		<div class="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
			<span class="size-1.5 rounded-full bg-primary"></span>
			ATP & WTA Rankings
		</div>
		<h1 class="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
			Pro Tennis<br class="md:hidden" /><span class="text-primary"> Statistics</span>
		</h1>
		<p class="max-w-xl text-base text-muted-foreground">
			Current world rankings with a unique view of each player's points distribution over the calendar year — see what points are coming up for defense and what was just earned.
		</p>
	</div>

	<!-- Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<a
			href="/rankings/atp"
			class="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm transition-all hover:border-border hover:shadow-md"
		>
			<div class="absolute right-4 top-4 text-3xl opacity-20 transition-opacity group-hover:opacity-30">🎾</div>
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Men's Tour</p>
			<h2 class="mt-2 text-2xl font-bold text-foreground">ATP Rankings</h2>
			<p class="mt-1 text-sm text-muted-foreground">Top 100 ATP players with points breakdown</p>
			<div class="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
				View rankings
				<svg class="size-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<a
			href="/rankings/wta"
			class="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm transition-all hover:border-border hover:shadow-md"
		>
			<div class="absolute right-4 top-4 text-3xl opacity-20 transition-opacity group-hover:opacity-30">🏆</div>
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Women's Tour</p>
			<h2 class="mt-2 text-2xl font-bold text-foreground">WTA Rankings</h2>
			<p class="mt-1 text-sm text-muted-foreground">Top 100 WTA players with points breakdown</p>
			<div class="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
				View rankings
				<svg class="size-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>
	</div>

	<!-- Feature callout -->
	<div class="rounded-2xl border border-border/60 bg-muted/40 p-5">
		<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How to read the chart</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Each bar represents points earned at a tournament. Bars on the <strong class="text-foreground">left</strong> are expiring soon — those points will drop from a player's ranking.
			Bars on the <strong class="text-foreground">right</strong> are freshly earned and safe for months. Hover a bar for event details.
		</p>
		<div class="mt-3 flex flex-wrap gap-3">
			{#each [['Grand Slam', 'oklch(0.60 0.22 285)'], ['Masters 1000', 'oklch(0.52 0.20 245)'], ['500', 'oklch(0.56 0.17 160)'], ['250', 'oklch(0.70 0.15 85)']] as [label, color]}
				<div class="flex items-center gap-1.5">
					<span class="size-2.5 rounded-sm" style="background:{color}"></span>
					<span class="text-xs text-muted-foreground">{label}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
