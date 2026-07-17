<script lang="ts">
	import { SHOW_LIVE_POINTS } from '$lib/flags';
</script>

<div class="hidden grid-cols-[3rem_1.5fr_6rem_minmax(0,1.5fr)] gap-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
	<span>Rank</span>
	<span>Player</span>
	<span class="text-right">Points</span>
	<div class="flex items-center justify-between gap-2">
		<span>Points Distribution (52 weeks)</span>
		{#if SHOW_LIVE_POINTS}
			<span>LIVE</span>
		{/if}
	</div>
</div>
