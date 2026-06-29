<script lang="ts">
	import type { TournamentResult } from '$lib/types';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let { results, isHovering = false }: { results: TournamentResult[]; isHovering?: boolean } = $props();

	let containerW = $state(400);
	const CHART_H = 52;
	const BASELINE_Y = CHART_H;
	const ROUND_Y = BASELINE_Y + 11;  // round label baseline
	const LOGO_Y = ROUND_Y + 5;       // logo zone start
	const LOGO_H = 18;
	const LOGO_W = 32;
	const H = LOGO_Y + LOGO_H + 2;    // 88
	const BAR_W = 10;

	const today = new Date();
	const YEAR = today.getFullYear();
	const yearStart = new Date(YEAR, 0, 1);
	const yearEnd = new Date(YEAR, 10, 30); // Nov 30 — cut offseason

	const span = yearEnd.getTime() - yearStart.getTime();

	const TIER_MAX: Record<string, number> = {
		'Grand Slam': 2000,
		'1000': 1000,
		'500': 500,
		'250': 280,
		'Other': 150,
	};

	const TYPE_COLORS_LIGHT: Record<string, string> = {
		'1000': 'oklch(0.52 0.20 245)',
		'500':  'oklch(0.56 0.17 160)',
		'250':  'oklch(0.70 0.15 85)',
		'Other':'oklch(0.55 0.01 220)',
	};
	const TYPE_COLORS_DARK: Record<string, string> = {
		'1000': 'oklch(0.68 0.20 245)',
		'500':  'oklch(0.70 0.17 160)',
		'250':  'oklch(0.80 0.15 85)',
		'Other':'oklch(0.65 0.01 220)',
	};

	const GS_BRAND: Array<{ keys: string[]; light: string; dark: string; logo: string }> = [
		{ keys: ['australian'],       light: 'oklch(0.58 0.22 220)', dark: 'oklch(0.72 0.22 220)', logo: '/images/gs-ao.png' },
		{ keys: ['french', 'roland'], light: 'oklch(0.58 0.23 32)',  dark: 'oklch(0.72 0.23 32)',  logo: '/images/gs-rg.png' },
		{ keys: ['wimbledon'],        light: 'oklch(0.50 0.20 148)', dark: 'oklch(0.66 0.20 148)', logo: '/images/gs-wimbledon.png' },
		{ keys: ['u.s.', 'us open'],  light: 'oklch(0.50 0.24 265)', dark: 'oklch(0.65 0.24 265)', logo: '/images/gs-uso.png' },
	];
	const GS_FALLBACK = { light: 'oklch(0.60 0.22 285)', dark: 'oklch(0.72 0.22 285)' };

	let isDark = $state(false);

	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
		const observer = new MutationObserver(() => {
			isDark = document.documentElement.classList.contains('dark');
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	});

	function gsBrand(name: string) {
		const lower = name.toLowerCase();
		return GS_BRAND.find((b) => b.keys.some((k) => lower.includes(k))) ?? null;
	}

	function color(result: TournamentResult): string {
		if (result.event_type === 'Grand Slam') {
			return isDark ? GS_FALLBACK.dark : GS_FALLBACK.light;
		}
		return isDark
			? (TYPE_COLORS_DARK[result.event_type] ?? TYPE_COLORS_DARK['Other'])
			: (TYPE_COLORS_LIGHT[result.event_type] ?? TYPE_COLORS_LIGHT['Other']);
	}

	const earnedResults = $derived(
		results.filter((r) => {
			const d = new Date(r.event_date_start);
			return d.getFullYear() === YEAR && d <= yearEnd;
		})
	);

	const defendResults = $derived(
		results
			.filter((r) => new Date(r.event_date_start).getFullYear() < YEAR)
			.map((r) => {
				const d = new Date(r.event_date_start);
				const mm = String(d.getMonth() + 1).padStart(2, '0');
				const dd = String(d.getDate()).padStart(2, '0');
				return { ...r, event_date_start: `${YEAR}-${mm}-${dd}` };
			})
			.filter((r) => {
				const d = new Date(r.event_date_start);
				return d > today && d <= yearEnd;
			})
	);

	// Per-player peak (zoom target)
	const playerPeak = $derived(
		Math.max(100, ...[...earnedResults, ...defendResults].map((r) => r.points_earned))
	);

	// Animates between 2000 (default) and playerPeak (zoomed)
	const maxPts = new Tween(2000, { duration: 350, easing: cubicOut });

	$effect(() => { maxPts.target = isHovering ? playerPeak : 2000; });

	// Tier-max bars fade out as zoom deepens (1 = default scale, 0 = fully zoomed)
	const tierOpacity = $derived(
		playerPeak >= 2000 ? 1 : Math.max(0, (maxPts.current - playerPeak) / (2000 - playerPeak))
	);

	function xPos(dateStr: string): number {
		const d = new Date(dateStr);
		const ratio = (d.getTime() - yearStart.getTime()) / span;
		return Math.max(0, Math.min(containerW - BAR_W, ratio * (containerW - BAR_W)));
	}

	function barH(points: number): number {
		return Math.max(2, (points / maxPts.current) * CHART_H);
	}

	// Tier-max bar capped at full chart height
	function tierH(eventType: string): number {
		return Math.min(CHART_H, barH(TIER_MAX[eventType] ?? 150));
	}

	function logoX(dateStr: string): number {
		const cx = xPos(dateStr) + BAR_W / 2;
		return Math.max(0, Math.min(containerW - LOGO_W, cx - LOGO_W / 2));
	}

	const todayX = $derived(((today.getTime() - yearStart.getTime()) / span) * containerW);

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

	function monthStartX(m: number): number {
		return ((new Date(YEAR, m, 1).getTime() - yearStart.getTime()) / span) * containerW;
	}

	type TooltipData = { clientX: number; clientY: number; result: TournamentResult };
	let tooltip = $state<TooltipData | null>(null);

	function shortResult(r: string): string {
		if (r === 'W') return '🏆';
		if (r === 'R16') return '16';
		if (r === 'R32') return '32';
		if (r === 'R64') return '64';
		return r;
	}
</script>

<div class="relative w-full select-none" bind:clientWidth={containerW}>
	<svg
		viewBox="0 0 {containerW} {H}"
		class="w-full overflow-visible"
		style="height: 5.5rem"
		role="img"
		aria-label="Points distribution — {YEAR}"
	>
		<!-- Y-axis max label (top-right, animates with tween) -->
		<text
			x={containerW - 2}
			y={7}
			font-size="10"
			fill="currentColor"
			fill-opacity="0.30"
			text-anchor="end"
			pointer-events="none"
		>{Math.round(maxPts.current).toLocaleString()}</text>

		<!-- Subtle month grid lines (no labels) -->
		{#each MONTHS as _, i}
			<line
				x1={monthStartX(i)}
				y1="0"
				x2={monthStartX(i)}
				y2={BASELINE_Y}
				stroke="currentColor"
				stroke-width="0.5"
				class="text-border/30"
			/>
		{/each}

		<!-- Baseline -->
		<line x1="0" y1={BASELINE_Y} x2={containerW} y2={BASELINE_Y} stroke="currentColor" stroke-width="0.8" class="text-border" />

		<!-- Tier-max background for earned events (visual only, fades on zoom) -->
		{#each earnedResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const maxH = tierH(result.event_type)}
			<rect {x} y={BASELINE_Y - maxH} width={BAR_W} height={maxH} fill={color(result)} fill-opacity="0.08" opacity={tierOpacity} rx="2" pointer-events="none" />
		{/each}

		<!-- Defend bars (visual only) -->
		{#each defendResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const h = barH(result.points_earned)}
			{@const c = color(result)}
			<rect {x} y={BASELINE_Y - tierH(result.event_type)} width={BAR_W} height={tierH(result.event_type)} fill={c} fill-opacity="0.08" opacity={tierOpacity} rx="2" pointer-events="none" />
			<rect {x} y={BASELINE_Y - h} width={BAR_W} height={h} fill={c} rx="2" opacity="0.92" pointer-events="none" />
			<text x={x + BAR_W / 2} y={ROUND_Y} font-size="9" fill={c} fill-opacity="0.85" text-anchor="middle" pointer-events="none">{shortResult(result.result)}</text>
		{/each}

		<!-- Earned bars (visual only) -->
		{#each earnedResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const h = barH(result.points_earned)}
			{@const c = color(result)}
			<rect {x} y={BASELINE_Y - h} width={BAR_W} height={h} fill={c} rx="2" opacity="0.92" pointer-events="none" />
			<text x={x + BAR_W / 2} y={ROUND_Y} font-size="9" fill={c} fill-opacity="0.85" text-anchor="middle" pointer-events="none">{shortResult(result.result)}</text>
		{/each}

		<!-- Hit areas — transparent rects covering full tier-max height for each bar -->
		{#each earnedResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const maxH = tierH(result.event_type)}
			<rect
				{x} y={BASELINE_Y - maxH} width={BAR_W} height={maxH}
				fill="transparent"
				role="button"
				tabindex="0"
				aria-label={result.event_name}
				class="cursor-pointer"
				onmouseenter={(e) => { tooltip = { clientX: e.clientX, clientY: e.clientY, result }; }}
				onmouseleave={() => { tooltip = null; }}
				onmousemove={(e) => { if (tooltip) tooltip = { ...tooltip, clientX: e.clientX, clientY: e.clientY }; }}
			/>
		{/each}
		{#each defendResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const maxH = tierH(result.event_type)}
			<rect
				{x} y={BASELINE_Y - maxH} width={BAR_W} height={maxH}
				fill="transparent"
				role="button"
				aria-label={result.event_name}
				tabindex="0"
				class="cursor-pointer"
				onmouseenter={(e) => { tooltip = { clientX: e.clientX, clientY: e.clientY, result }; }}
				onmouseleave={() => { tooltip = null; }}
				onmousemove={(e) => { if (tooltip) tooltip = { ...tooltip, clientX: e.clientX, clientY: e.clientY }; }}
			/>
		{/each}

		<!-- Today indicator -->
		{#if todayX >= 0 && todayX <= containerW}
			<line x1={todayX} y1="0" x2={todayX} y2={BASELINE_Y} stroke="currentColor" stroke-width="1.2" stroke-dasharray="2,2" class="text-foreground/50" />
			<polygon points="{todayX - 3},0 {todayX + 3},0 {todayX},5" fill="currentColor" class="text-foreground/60" />
		{/if}

		<!-- Grand Slam logos below round labels — full opacity for both earned and defend -->
		{#each earnedResults as result}
			{#if result.event_type === 'Grand Slam'}
				{@const brand = gsBrand(result.event_name)}
				{#if brand}
					<image href={brand.logo} x={logoX(result.event_date_start)} y={LOGO_Y} width={LOGO_W} height={LOGO_H} preserveAspectRatio="xMidYMid meet" />
				{/if}
			{/if}
		{/each}
		{#each defendResults as result}
			{#if result.event_type === 'Grand Slam'}
				{@const brand = gsBrand(result.event_name)}
				{#if brand}
					<image href={brand.logo} x={logoX(result.event_date_start)} y={LOGO_Y} width={LOGO_W} height={LOGO_H} preserveAspectRatio="xMidYMid meet" />
				{/if}
			{/if}
		{/each}
	</svg>

	<!-- Tooltip -->
	{#if tooltip}
		<div
			class="pointer-events-none fixed z-50 min-w-40 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
			style="left: {tooltip.clientX}px; top: {tooltip.clientY - 115}px; transform: translateX(-50%)"
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
