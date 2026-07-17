<script lang="ts">
	import type { TournamentResult } from '$lib/types';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { computePosition, offset, flip, shift, autoUpdate } from '@floating-ui/dom';
	import { Badge } from '$lib/components/ui/badge';
	import { getNow } from '$lib/now';
	import { SHOW_LIVE_POINTS } from '$lib/flags';

	// `showLivePoints` defaults to the module-level feature flag but is a prop,
	// so it could later be driven per-user (a setting overriding the default).
	let {
		results,
		isHovering = false,
		showLivePoints = SHOW_LIVE_POINTS,
	}: { results: TournamentResult[]; isHovering?: boolean; showLivePoints?: boolean } = $props();

	let containerW = $state(400);
	const CHART_H = 52;
	const BASELINE_Y = CHART_H;
	const ROUND_Y = BASELINE_Y + 11;  // round label baseline
	const LOGO_Y = ROUND_Y + 5;       // logo zone start
	const LOGO_H = 18;
	const LOGO_W = 32;
	const YEAR_AXIS_Y = LOGO_Y + LOGO_H + 10; // 96 — year bracket row
	const H = YEAR_AXIS_Y + 8;        // 104
	const BAR_W = 10;

	// Live pane — a small separated section at the right edge for the
	// in-progress tournament. Shares the y-axis with the main chart. Width is
	// reserved (so the time axis stays aligned across rows) whenever the live
	// feature is on; when off it collapses to 0 and the chart is pure 52 weeks.
	const LIVE_W = $derived(showLivePoints ? 26 : 0);   // live pane width
	const LIVE_GAP = $derived(showLivePoints ? 10 : 0); // gap main chart ↔ live pane (divider lives here)

	const MS_DAY = 86_400_000;
	const today = getNow(); // dev-simulatable "now" — see $lib/now.ts

	// Rolling window: exactly the trailing 52 weeks (windowStart → today).
	// The in-progress "current" event renders in the separate live pane.
	const windowStart = new Date(today.getTime() - 364 * MS_DAY);
	const span = today.getTime() - windowStart.getTime();

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

	// Parse a YYYY-MM-DD string as LOCAL time. Date-only strings parse as UTC
	// midnight, which shifts the calendar day in negative-offset timezones and
	// breaks day-of-week / month-day math.
	function localDate(dateStr: string, time = 'T12:00:00'): Date {
		return new Date(dateStr + time);
	}

	// Monday on or after a given date (the ATP drop-off anchor).
	function mondayOnOrAfter(d: Date): Date {
		const day = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
		const offset = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
		return new Date(d.getTime() + offset * 86_400_000);
	}

	// A result is visible until: 52 weeks after the Monday on-or-after its end date
	// (points are awarded on that Monday, expire exactly 52 weeks later, dropping
	// at the start of the expiry Monday). This mirrors how ATP ranking points work.
	const visibleResults = $derived(
		results.filter((r) => {
			const expiry = mondayOnOrAfter(localDate(r.event_date_end));
			expiry.setDate(expiry.getDate() + 364); // 52 weeks after award Monday
			expiry.setHours(0, 0, 0, 0); // drop at the start of that Monday
			return today < expiry;
		})
	);

	type VisibleResult = (typeof visibleResults)[number];

	// The in-progress tournament — flagged `live` by the ETL from an ongoing draw.
	// Its `result`/`points_earned` are the round + points reached SO FAR (a floor).
	// It renders in the separate live pane, not as a normal completed bar.
	const liveResult = $derived(
		showLivePoints ? (visibleResults.find((r) => r.live) ?? null) : null
	);

	// The same tournament one year earlier — the points being defended — if the
	// player played it and those points are still standing. Matched by name.
	const defendingResult = $derived(
		liveResult
			? (visibleResults.find((r) => !r.live && r.event_name === liveResult.event_name) ?? null)
			: null
	);

	// Main-chart bars exclude the live entry (it lives in the pane instead).
	const mainResults = $derived(visibleResults.filter((r) => !r.live));

	// Per-player peak (zoom target) — spans every visible bar incl. the live one,
	// so the y-axis autoscale always covers it.
	const playerPeak = $derived(
		Math.max(100, ...visibleResults.map((r) => r.points_earned))
	);

	// Animates between 2000 (default) and playerPeak (zoomed)
	const maxPts = new Tween(2000, { duration: 350, easing: cubicOut });

	$effect(() => { maxPts.target = isHovering ? playerPeak : 2000; });

	// Tier-max bars fade out as zoom deepens (1 = default scale, 0 = fully zoomed)
	const tierOpacity = $derived(
		playerPeak >= 2000 ? 1 : Math.max(0, (maxPts.current - playerPeak) / (2000 - playerPeak))
	);

	// Main chart width — everything left of the live pane.
	const mainW = $derived(containerW - LIVE_W - LIVE_GAP);

	function xPos(dateStr: string): number {
		const d = localDate(dateStr);
		const ratio = (d.getTime() - windowStart.getTime()) / span;
		return Math.max(0, Math.min(mainW - BAR_W, ratio * (mainW - BAR_W)));
	}

	// Raw (unclamped) x for axis features — month/year lines, year brackets.
	function axisX(d: Date): number {
		return ((d.getTime() - windowStart.getTime()) / span) * mainW;
	}

	function barH(points: number): number {
		return Math.max(2, (points / maxPts.current) * CHART_H);
	}

	// Tier-max bar capped at full chart height
	function tierH(eventType: string): number {
		return Math.min(CHART_H, barH(TIER_MAX[eventType] ?? 150));
	}

	// Center the logo on its bar — no clamping. Edge bars (clamped into the
	// window) keep their logo aligned; the ≤11px overhang is fine because the
	// svg is overflow-visible and sits inside the row's gap/padding.
	function logoX(dateStr: string): number {
		return xPos(dateStr) + BAR_W / 2 - LOGO_W / 2;
	}

	// Live pane geometry — bar and pulsing dot centered in the pane.
	const liveCX = $derived(containerW - LIVE_W / 2);
	const liveX = $derived(liveCX - BAR_W / 2);
	const dividerX = $derived(mainW + LIVE_GAP / 2);

	// First-of-month ticks inside the rolling window (subtle grid).
	const monthTicks = (() => {
		const ticks: Date[] = [];
		const d = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);
		while (d.getTime() <= today.getTime()) {
			if (d.getTime() >= windowStart.getTime()) ticks.push(new Date(d));
			d.setMonth(d.getMonth() + 1);
		}
		return ticks;
	})();

	// Calendar-year segments + internal Jan-1 dividers within the window.
	const yearSegments = (() => {
		const segs: { year: number; start: Date; end: Date }[] = [];
		let segStart = windowStart;
		for (let y = windowStart.getFullYear(); y <= today.getFullYear(); y++) {
			const nextJan = new Date(y + 1, 0, 1);
			const segEnd = nextJan.getTime() < today.getTime() ? nextJan : today;
			segs.push({ year: y, start: new Date(segStart), end: new Date(segEnd) });
			segStart = nextJan;
		}
		return segs;
	})();

	const yearDividers = (() => {
		const ds: Date[] = [];
		for (let y = windowStart.getFullYear() + 1; y <= today.getFullYear(); y++) {
			const jan = new Date(y, 0, 1);
			if (jan.getTime() > windowStart.getTime() && jan.getTime() < today.getTime()) ds.push(jan);
		}
		return ds;
	})();

	type TooltipData =
		| { anchor: Element; kind: 'single'; result: TournamentResult }
		| { anchor: Element; kind: 'current'; live: TournamentResult; defending: TournamentResult | null };
	let tooltip = $state<TooltipData | null>(null);

	// Live-bar tooltip: the in-progress run (left) plus, when the player is also
	// defending points from last year's edition, that card on the right.
	function liveTip(anchor: Element, r: VisibleResult): TooltipData {
		return { anchor, kind: 'current', live: r, defending: defendingResult };
	}

	// Floating UI positioning — anchored above the hovered bar, auto-flipped and
	// shifted so the card never leaves the viewport. autoUpdate keeps it pinned
	// through scroll/resize/zoom-tween while open.
	let tooltipEl = $state<HTMLDivElement | null>(null);
	let tooltipXY = $state<{ x: number; y: number } | null>(null);

	$effect(() => {
		const t = tooltip;
		const el = tooltipEl;
		if (!t || !el) {
			tooltipXY = null;
			return;
		}
		return autoUpdate(t.anchor, el, () => {
			computePosition(t.anchor, el, {
				strategy: 'fixed',
				placement: 'top',
				middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 })],
			}).then(({ x, y }) => {
				tooltipXY = { x, y };
			});
		});
	});

	// "2026-06-30" → "Jun-30"
	function fmtMD(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
	}

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
		style="height: 6.5rem"
		role="img"
		aria-label="Points distribution — last 12 months"
	>
		<!-- Y-axis max label (top-right of main chart, animates with tween) -->
		<text
			x={mainW - 2}
			y={7}
			font-size="10"
			fill="currentColor"
			fill-opacity="0.30"
			text-anchor="end"
			pointer-events="none"
		>{Math.round(maxPts.current).toLocaleString()}</text>

		<!-- Subtle month grid lines (no labels) -->
		{#each monthTicks as t}
			<line
				x1={axisX(t)}
				y1="0"
				x2={axisX(t)}
				y2={BASELINE_Y}
				stroke="currentColor"
				stroke-width="0.5"
				class="text-border/30"
			/>
		{/each}

		<!-- Year divider(s) — vertical split at Jan 1, behind bars -->
		{#each yearDividers as d}
			<line
				x1={axisX(d)}
				y1="0"
				x2={axisX(d)}
				y2={YEAR_AXIS_Y}
				stroke="currentColor"
				stroke-width="1.5"
				stroke-opacity="0.85"
				class="text-border"
			/>
		{/each}

		<!-- Baseline (main chart) -->
		<line x1="0" y1={BASELINE_Y} x2={mainW} y2={BASELINE_Y} stroke="currentColor" stroke-width="0.8" class="text-border" />

		<!-- Live pane frame — divider + its own baseline. Rendered whenever the
		     live feature is on (reserving the pane); content only when the player
		     is actually mid-tournament. -->
		{#if showLivePoints}
			<line x1={dividerX} y1="0" x2={dividerX} y2={BASELINE_Y} stroke="currentColor" stroke-width="1" stroke-opacity="0.8" class="text-border" />
			<line x1={mainW + LIVE_GAP} y1={BASELINE_Y} x2={containerW} y2={BASELINE_Y} stroke="currentColor" stroke-width="0.8" class="text-border" />
		{/if}

		<!-- Tier-max background (visual only, fades on zoom) -->
		{#each mainResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const maxH = tierH(result.event_type)}
			<rect {x} y={BASELINE_Y - maxH} width={BAR_W} height={maxH} fill={color(result)} fill-opacity="0.08" opacity={tierOpacity} rx="2" pointer-events="none" />
		{/each}

		<!-- Points bars + round labels -->
		{#each mainResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const h = barH(result.points_earned)}
			{@const c = color(result)}
			<rect {x} y={BASELINE_Y - h} width={BAR_W} height={h} fill={c} rx="2" opacity="0.92" pointer-events="none" />
			<text x={x + BAR_W / 2} y={ROUND_Y} font-size="9" fill={c} fill-opacity="0.85" text-anchor="middle" pointer-events="none">{shortResult(result.result)}</text>
		{/each}

		<!-- Live pane content — the in-progress tournament (round + points reached so
		     far), faded, with a breathing red "live" dot. Real data from the ongoing draw. -->
		{#if liveResult}
			{@const c = color(liveResult)}
			{@const maxH = tierH(liveResult.event_type)}
			{@const liveH = barH(liveResult.points_earned)}
			<rect x={mainW + LIVE_GAP} y="0" width={LIVE_W} height={BASELINE_Y} rx="3" fill="currentColor" fill-opacity="0.04" pointer-events="none" />
			<rect x={liveX} y={BASELINE_Y - maxH} width={BAR_W} height={maxH} fill={c} fill-opacity="0.08" opacity={tierOpacity} rx="2" pointer-events="none" />
			<rect x={liveX} y={BASELINE_Y - liveH} width={BAR_W} height={liveH} fill={c} rx="2" opacity="0.4" pointer-events="none" />
			<!-- Round label prefixed with a pulsing red "live" dot: "● SF" -->
			<circle cx={liveCX - 9} cy={ROUND_Y - 3} r="2.5" fill="currentColor" class="live-dot-ring text-red-500" pointer-events="none" />
			<circle cx={liveCX - 9} cy={ROUND_Y - 3} r="2.5" fill="currentColor" class="live-dot-core text-red-500" pointer-events="none" />
			<text x={liveCX + 1} y={ROUND_Y} font-size="9" fill={c} fill-opacity="0.5" text-anchor="middle" pointer-events="none">{shortResult(liveResult.result)}</text>
			{#if liveResult.event_type === 'Grand Slam'}
				{@const brand = gsBrand(liveResult.event_name)}
				{#if brand}
					<image href={brand.logo} x={liveCX - LOGO_W / 2} y={LOGO_Y} width={LOGO_W} height={LOGO_H} opacity="0.7" preserveAspectRatio="xMidYMid meet" />
				{/if}
			{/if}
		{/if}

		<!-- Hit areas — transparent rects covering full tier-max height -->
		{#each mainResults as result}
			{@const x = xPos(result.event_date_start)}
			{@const maxH = tierH(result.event_type)}
			<rect
				{x} y={BASELINE_Y - maxH} width={BAR_W} height={maxH}
				fill="transparent"
				role="button"
				tabindex="0"
				aria-label={result.event_name}
				class="cursor-pointer"
				onmouseenter={(e) => { tooltip = { anchor: e.currentTarget, kind: 'single', result }; }}
				onmouseleave={() => { tooltip = null; }}
			/>
		{/each}

		<!-- Live bar hit area — carries the two-pane (Live | Defending) tooltip -->
		{#if liveResult}
			{@const maxH = tierH(liveResult.event_type)}
			{@const r = liveResult}
			<rect
				x={liveX} y={BASELINE_Y - maxH} width={BAR_W} height={maxH}
				fill="transparent"
				role="button"
				tabindex="0"
				aria-label="{r.event_name} — live"
				class="cursor-pointer"
				onmouseenter={(e) => { tooltip = liveTip(e.currentTarget, r); }}
				onmouseleave={() => { tooltip = null; }}
			/>
		{/if}

		<!-- Grand Slam logos below round labels -->
		{#each mainResults as result}
			{#if result.event_type === 'Grand Slam'}
				{@const brand = gsBrand(result.event_name)}
				{#if brand}
					<image href={brand.logo} x={logoX(result.event_date_start)} y={LOGO_Y} width={LOGO_W} height={LOGO_H} preserveAspectRatio="xMidYMid meet" />
				{/if}
			{/if}
		{/each}

		<!-- Year axis — labeled span lines. Divider-side ends tee cleanly into the
		     Jan-1 vertical line (no end ticks); outer ends get arrowheads implying
		     the timeline continues; the latest year extends across the live pane. -->
		{#each yearSegments as seg, i}
			{@const isFirst = i === 0}
			{@const isLast = i === yearSegments.length - 1}
			{@const x0 = Math.max(0, axisX(seg.start))}
			{@const x1 = isLast ? containerW : Math.min(mainW, axisX(seg.end))}
			{@const mid = (x0 + x1) / 2}
			<text x={mid} y={YEAR_AXIS_Y} font-size="11" font-weight="700" fill="currentColor" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" pointer-events="none">{seg.year}</text>
			{#if mid - 16 > x0 + 6}
				<line x1={x0} y1={YEAR_AXIS_Y} x2={mid - 16} y2={YEAR_AXIS_Y} stroke="currentColor" stroke-width="1.25" class="text-border" />
				<line x1={mid + 16} y1={YEAR_AXIS_Y} x2={x1} y2={YEAR_AXIS_Y} stroke="currentColor" stroke-width="1.25" class="text-border" />
				{#if isFirst}
					<polyline points="{x0 + 5},{YEAR_AXIS_Y - 3.5} {x0},{YEAR_AXIS_Y} {x0 + 5},{YEAR_AXIS_Y + 3.5}" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round" class="text-border" />
				{/if}
				{#if isLast}
					<polyline points="{x1 - 5},{YEAR_AXIS_Y - 3.5} {x1},{YEAR_AXIS_Y} {x1 - 5},{YEAR_AXIS_Y + 3.5}" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round" class="text-border" />
				{/if}
			{/if}
		{/each}
	</svg>

	<!-- Reusable tournament card snippet -->
	{#snippet tournamentCard(r: TournamentResult, resultLabel: string, pts: number, ptsClass: string)}
		<p class="truncate text-xs font-semibold text-popover-foreground">{r.event_name}</p>
		<p class="text-xs text-muted-foreground">{r.event_type}</p>
		<p class="text-xs text-muted-foreground">{fmtMD(r.event_date_start)} – {fmtMD(r.event_date_end)}, {r.event_date_start.slice(0, 4)}</p>
		<p class="mt-1 text-xs">
			<span class="font-bold text-foreground">{resultLabel}</span>
			<span class="ml-1 {ptsClass}">{pts.toLocaleString()} pts</span>
		</p>
	{/snippet}

	<!-- Tooltip — positioned by Floating UI (see the $effect above); hidden
	     until the first computePosition resolves to avoid a flash at 0,0 -->
	{#if tooltip}
		<div
			bind:this={tooltipEl}
			class="pointer-events-none fixed z-50 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg {tooltip.kind === 'current' && tooltip.defending ? 'min-w-80' : 'min-w-48'}"
			style="left: {tooltipXY?.x ?? 0}px; top: {tooltipXY?.y ?? 0}px; visibility: {tooltipXY ? 'visible' : 'hidden'}"
		>
			{#if tooltip.kind === 'current'}
				<div class="grid gap-3 {tooltip.defending ? 'grid-cols-2' : 'grid-cols-1'}">
					<div class="min-w-0">
						<Badge variant="secondary" class="mb-1 h-4 text-[10px] font-bold uppercase text-green-600 bg-green-500/10">Live</Badge>
						{@render tournamentCard(tooltip.live, tooltip.live.result, tooltip.live.points_earned, 'font-semibold text-primary')}
					</div>
					{#if tooltip.defending}
						<div class="min-w-0 border-l border-border pl-3">
							<Badge variant="secondary" class="mb-1 h-4 text-[10px] font-bold uppercase text-muted-foreground">Defending</Badge>
							{@render tournamentCard(tooltip.defending, tooltip.defending.result, tooltip.defending.points_earned, 'font-semibold text-muted-foreground')}
						</div>
					{/if}
				</div>
			{:else}
				{@render tournamentCard(tooltip.result, tooltip.result.result, tooltip.result.points_earned, 'font-semibold text-primary')}
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Breathing "live" indicator: a steady core dot plus an expanding ring. */
	.live-dot-core {
		animation: live-breathe 1.8s ease-in-out infinite;
	}
	.live-dot-ring {
		animation: live-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
		transform-box: fill-box;
		transform-origin: center;
	}
	@keyframes live-breathe {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.55; }
	}
	@keyframes live-ping {
		0% { transform: scale(1); opacity: 0.6; }
		80%, 100% { transform: scale(2.6); opacity: 0; }
	}
</style>
