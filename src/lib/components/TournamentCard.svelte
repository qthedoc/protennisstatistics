<script lang="ts">
	import type { TournamentResult } from '$lib/types';

	// Presentational tournament card body — shared by the chart tooltip and the
	// ranking-row hover cards so both render identically. Wrap it with a badge /
	// positioning in the consumer.
	let {
		result,
		resultLabel,
		pts,
		ptsClass
	}: { result: TournamentResult; resultLabel: string; pts: number; ptsClass: string } = $props();

	// "2026-06-30" → "Jun 30"
	function fmtMD(dateStr: string): string {
		return new Date(dateStr + 'T12:00:00').toLocaleString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<p class="truncate text-xs font-semibold text-popover-foreground">{result.event_name}</p>
<p class="text-xs text-muted-foreground">{result.event_type}</p>
<p class="text-xs text-muted-foreground">
	{fmtMD(result.event_date_start)} – {fmtMD(result.event_date_end)}, {result.event_date_start.slice(
		0,
		4
	)}
</p>
<p class="mt-1 text-xs">
	<span class="font-bold text-foreground">{resultLabel}</span>
	<span class="ml-1 {ptsClass}">{pts.toLocaleString()} pts</span>
</p>
