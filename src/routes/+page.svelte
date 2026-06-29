<script>
	import WtaLogo from '$lib/components/WtaLogo.svelte';
    import { ChevronRight } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Pro Tennis Statistics</title>
	<meta name="description" content="Live ATP and WTA rankings with points distribution across the last 12 months." />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-10">
	<!-- Hero -->
	<div class="space-y-4 pt-4">
		<div class="md:flex md:items-center md:gap-4">
			<img src="/images/logo.svg" alt="Pro Tennis Statistics" class="size-18" />
			<h1 class="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
				Pro Tennis<br class="md:hidden" /><span class="text-primary">{" "}Statistics</span>
			</h1>
		</div>
		<p class="max-w-xl text-base text-muted-foreground">
			Current tennis rankings <strong class="text-foreground">with point breakdown</strong> for the last 52 weeks. 
			Finally a way to see <strong class="text-foreground">how many points</strong> a player has to defend and <strong class="text-foreground">when</strong>.
		</p>
	</div>

	<!-- Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<a
			href="/rankings/atp"
			class="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm transition-all hover:border-border hover:shadow-md"
		>
			<img src="/images/tour-atp.png" alt="atp logo" class="h-10 object-contain opacity-80 transition-opacity group-hover:opacity-100" />
			<p class="mt-4 text-sm text-muted-foreground">Top 100 ATP players with points breakdown</p>
			<div class="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary opacity-80 transition-opacity group-hover:opacity-100">
				View rankings
				<ChevronRight class="size-4.5"/>
			</div>
		</a>

		<a
			href="/rankings/wta"
			class="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm transition-all hover:border-border hover:shadow-md"
		>
			<WtaLogo class="h-10 opacity-80 transition-opacity group-hover:opacity-100" />
			<p class="mt-4 text-sm text-muted-foreground">Top 100 WTA players with points breakdown</p>
			<div class="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary opacity-80 transition-opacity group-hover:opacity-100">
				View rankings
				<ChevronRight class="size-4.5"/>
			</div>
		</a>
	</div>

	<!-- Feature callout -->
	<div class="rounded-2xl border border-border/60 bg-muted/40 p-5">
		<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How to read the chart</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Each bar represents points earned at a tournament thru the calendar year. Bars on the <strong class="text-foreground">right</strong> are freshly earned. 
			Bars on the <strong class="text-foreground">left</strong> are expiring soon and must be defended.
			<!-- Bars on the <strong class="text-foreground">right</strong> are fresh and safe for months. Hover a bar for event details. -->
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
