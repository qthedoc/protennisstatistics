<script lang="ts">
	import type { TournamentResult } from '$lib/types';

	let { results }: { results: TournamentResult[] } = $props();

	const W = 400;
	const H = 56;
	const CHART_H = 48;
	const BAR_W = 10;
	const MAX_PTS = 2000;

	const today = new Date('2026-06-13');
	const yearAgo = new Date('2025-06-13');
	const span = today.getTime() - yearAgo.getTime();

	const EVENT_COLORS: Record<string, string> = {
		'Grand Slam': 'oklch(0.60 0.22 285)',
		'1000': 'oklch(0.52 0.20 245)',
		'500': 'oklch(0.56 0.17 160)',
		'250': 'oklch(0.70 0.15 85)',
		'Other': 'oklch(0.55 0.01 220)',
	};

	const EVENT_COLORS_DARK: Record<string, string> = {
		'Grand Slam': 'oklch(0.72 0.22 285)',
		'1000': 'oklch(0.68 0.20 245)',
		'500': 'oklch(0.70 0.17 160)',
		'250': 'oklch(0.80 0.15 85)',
		'Other': 'oklch(0.65 0.01 220)',
	};

	function xPos(dateStr: string): number {
		const d = new Date(dateStr);
		const ratio = (d.getTime() - yearAgo.getTime()) / span;
		return Math.max(0, Math.min(W - BAR_W, ratio * (W - BAR_W)));
	}

	function barH(points: number): number {
		return Math.max(3, (points / MAX_PTS) * CHART_H);
	}

	let tooltip = $state<{ clientX: number; clientY: number; result: TournamentResult } | null>(null);

	const months = [
		'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'
	];

	function monthXPos(monthIndex: number): number {
		return (monthIndex / 12) * W;
	}

	const isDark = $derived(
		typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
	);
</script>

<div class="relative w-full select-none">
	<svg
		viewBox="0 0 {W} {H}"
		class="w-full overflow-visible"
		style="height: 3.5rem"
		role="img"
		aria-label="Points distribution chart"
	>
		<!-- Grid lines for months -->
		{#each months as month, i}
			{#if i < 12}
				<line
					x1={monthXPos(i)}
					y1="0"
					x2={monthXPos(i)}
					y2={CHART_H}
					stroke="currentColor"
					stroke-width="0.5"
					class="text-border/40"
				/>
			{/if}
		{/each}

		<!-- Baseline -->
		<line x1="0" y1={CHART_H} x2={W} y2={CHART_H} stroke="currentColor" stroke-width="0.8" class="text-border" />

		<!-- Bars -->
		{#each results as result}
			{@const x = xPos(result.event_date_start)}
			{@const h = barH(result.points_earned)}
			{@const color = isDark ? EVENT_COLORS_DARK[result.event_type] : EVENT_COLORS[result.event_type]}
			<rect
				{x}
				y={CHART_H - h}
				width={BAR_W}
				height={h}
				fill={color ?? EVENT_COLORS['Other']}
				rx="2"
				class="cursor-pointer opacity-90 transition-opacity hover:opacity-100"
				onmouseenter={(e) => { tooltip = { clientX: e.clientX, clientY: e.clientY, result }; }}
				onmouseleave={() => { tooltip = null; }}
				onmousemove={(e) => { if (tooltip) tooltip = { ...tooltip, clientX: e.clientX, clientY: e.clientY }; }}
			/>
		{/each}

		<!-- Month labels -->
		{#each months as month, i}
			<text
				x={monthXPos(i)}
				y={H - 1}
				font-size="7"
				fill="currentColor"
				class="text-muted-foreground/60"
				text-anchor="middle"
			>{month}</text>
		{/each}
	</svg>

	<!-- Tooltip -->
	{#if tooltip}
		<div
			class="pointer-events-none fixed z-50 min-w-[160px] rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
			style="left: {tooltip.clientX}px; top: {tooltip.clientY - 110}px; transform: translateX(-50%)"
		>
			<p class="text-xs font-semibold text-popover-foreground">{tooltip.result.event_name}</p>
			<p class="mt-0.5 text-xs text-muted-foreground">{tooltip.result.event_type}</p>
			<div class="mt-1.5 flex items-center justify-between gap-3">
				<span class="text-xs text-muted-foreground">{tooltip.result.event_date_start.slice(0, 7)}</span>
				<span class="text-xs font-bold text-foreground">{tooltip.result.result}</span>
				<span class="text-xs font-semibold text-primary">+{tooltip.result.points_earned.toLocaleString()} pts</span>
			</div>
		</div>
	{/if}
</div>
