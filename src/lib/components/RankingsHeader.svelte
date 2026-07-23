<script lang="ts">
	import { SHOW_LIVE_POINTS } from '$lib/flags';
</script>

{#if SHOW_LIVE_POINTS}
	<!-- Grid template MUST match PlayerRow's live-on template. -->
	<div class="hidden grid-cols-[3rem_1.25fr_4.5rem_6rem_minmax(0,1.75fr)] gap-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
		<span>Rank</span>
		<span>Player</span>
		<span class="text-center">Points</span>
		<span class="text-center">This Week</span>
		<div class="flex items-center justify-between gap-2">
			<span>Points Distribution (52 weeks)</span>
			<span>Live</span>
		</div>
	</div>
{:else}
	<div class="hidden grid-cols-[3rem_1.5fr_6rem_minmax(0,1.5fr)] gap-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
		<span>Rank</span>
		<span>Player</span>
		<span class="text-right">Points</span>
		<div class="flex items-center gap-2">
			<span>Points Distribution (52 weeks)</span>
		</div>
	</div>
{/if}
