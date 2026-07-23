<script lang="ts">
	import type { Player } from '$lib/types';
	import PointsBarChart from './PointsBarChart.svelte';
	import TournamentCard from './TournamentCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { computeLive } from '$lib/live-points';
	import { SHOW_LIVE_POINTS } from '$lib/flags';
	import { computePosition, offset, flip, shift, autoUpdate } from '@floating-ui/dom';
	import { ChevronsDownUp, ChevronsUpDown, ArrowUp, ArrowDown } from '@lucide/svelte';

	let {
		player,
		selectedName = null,
		rankDelta,
		ongoingNames,
		onselect,
	}: {
		player: Player;
		selectedName?: string | null;
		/** official_rank − live_rank; >0 = moved up. Omitted where the full field
		 *  isn't loaded (e.g. the single-row home demo). */
		rankDelta?: number;
		/** In-progress event names across the field — lets the row surface points
		 *  defended at a tournament this player didn't re-enter. Omitted on the
		 *  single-row home demo (defending then only shows when the player plays). */
		ongoingNames?: Set<string>;
		onselect?: (name: string | null) => void;
	} = $props();

	let isHovering = $state(false);
	const isSelected = $derived(selectedName === player.name);
	const zoomed = $derived(isHovering || isSelected);

	// Derived live-points picture — same math the chart uses (shared util).
	const lp = $derived(computeLive(player, undefined, ongoingNames));

	function toggle() {
		onselect?.(isSelected ? null : player.name);
	}

	function countryFlag(code: string): string {
		return code
			.toUpperCase()
			.split('')
			.map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
			.join('');
	}

	function signed(n: number): string {
		return n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString();
	}

	const rankColors: Record<number, string> = {
		1: 'text-amber-500 font-bold',
		2: 'text-slate-400 font-bold',
		3: 'text-amber-700 font-bold',
	};

	const SelectIcon = $derived(isSelected ? ChevronsDownUp : ChevronsUpDown);

	// Single hover card for the whole This Week cell — positioned by Floating UI,
	// mirroring the chart's tooltip. Anchored to the hovered cell; the card body
	// reads this row's derived `lp` (net swing + rank move + live/defending).
	let cardAnchor = $state<Element | null>(null);
	let cardEl = $state<HTMLDivElement | null>(null);
	let cardXY = $state<{ x: number; y: number } | null>(null);

	// Has this player any live activity worth a card?
	const hasActivity = $derived(lp.delta !== 0 || !!rankDelta || !!lp.live || !!lp.defending);

	$effect(() => {
		const a = cardAnchor;
		const el = cardEl;
		if (!a || !el) {
			cardXY = null;
			return;
		}
		return autoUpdate(a, el, () => {
			computePosition(a, el, {
				strategy: 'fixed',
				placement: 'top',
				middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 })],
			}).then(({ x, y }) => {
				cardXY = { x, y };
			});
		});
	});
</script>

<div
	role="button"
	tabindex="0"
	class="group grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50 {SHOW_LIVE_POINTS ? 'md:grid-cols-[3rem_1.25fr_4.5rem_6rem_minmax(0,1.75fr)]' : 'md:grid-cols-[3rem_1.5fr_6rem_minmax(0,1.5fr)]'} {isSelected ? 'bg-muted/50 ring-1 ring-border' : ''}"
	onmouseenter={() => isHovering = true}
	onmouseleave={() => isHovering = false}
	onclick={toggle}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
>
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

	<!-- Expand icon — mobile only, col-3 auto slot -->
	<div class="flex items-center justify-center md:hidden">
		<SelectIcon
			class="size-4 text-muted-foreground"
		/>
	</div>

	{#if SHOW_LIVE_POINTS}
		<!-- Points (official total) — desktop only, prominent number -->
		<div class="hidden flex-col items-center justify-center md:flex">
			<span class="text-lg font-bold tabular-nums text-foreground">{player.current_points.toLocaleString()}</span>
		</div>

		<!-- This Week — the whole cell is a single hover trigger → combined card
		     (net swing + rank move + live/defending tournament cards). Role-less
		     hover (clicking still toggles the row, so no interactive element nests
		     inside the row's own role=button).
		     One inline layout: current / defending, on the same level split by a
		     slash. Each side is its points or a long-dash placeholder when that
		     side is absent (playing but nothing to defend, or defending an event
		     not re-entered). Breathing dot precedes current while the player is
		     still IN the event — dot = player-in, NOT event-over. Neither side =>
		     the single big dash. -->
		{#if hasActivity}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="hidden cursor-help flex-col items-center justify-center md:flex"
				aria-label="{player.name} — this week's points movement"
				onmouseenter={(e) => (cardAnchor = e.currentTarget)}
				onmouseleave={() => (cardAnchor = null)}
			>
				{#if lp.live || lp.defending}
					<span class="flex items-center gap-1 text-xs tabular-nums">
						{#if lp.liveIn}
							<span class="relative mr-0.5 flex size-2" aria-hidden="true">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60"></span>
								<span class="relative inline-flex size-2 rounded-full bg-green-500"></span>
							</span>
						{/if}
						{#if lp.live}
							<span class="font-semibold text-green-600 dark:text-green-400">+{lp.liveEarned.toLocaleString()}</span>
						{:else}
							<span class="text-muted-foreground">—</span>
						{/if}
						<span class="text-muted-foreground/60">/</span>
						{#if lp.defending}
							<span class="text-muted-foreground">{lp.defendingPoints.toLocaleString()}</span>
						{:else}
							<span class="text-muted-foreground">—</span>
						{/if}
					</span>
				{:else}
					<!-- rank moved only via others' swings — card has the arrow -->
					<span class="text-xs text-muted-foreground">—</span>
				{/if}
			</div>
		{:else}
			<!-- No activity this week. -->
			<div class="hidden flex-col items-center justify-center md:flex">
				<span class="text-xs text-muted-foreground">—</span>
			</div>
		{/if}
	{:else}
		<!-- Points — desktop only, col-3 slot (live feature off) -->
		<div class="hidden text-right md:block">
			<p class="text-sm font-bold tabular-nums text-foreground">{player.current_points.toLocaleString()}</p>
			<p class="text-xs text-muted-foreground">pts</p>
		</div>
	{/if}

	<!-- Bar Chart -->
	<div class="col-span-3 mt-1 md:col-span-1 md:mt-0">
		<PointsBarChart results={player.points_distribution} isHovering={zoomed} />
	</div>
</div>

<!-- Combined hover card — Floating UI positioned, hidden until first resolve.
     This-week summary on top (net swing + rank move), then the Live and
     Defending tournament cards SIDE BY SIDE (each optional). -->
{#if cardAnchor}
	<div
		bind:this={cardEl}
		class="pointer-events-none fixed z-50 flex flex-col gap-2 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
		style="left: {cardXY?.x ?? 0}px; top: {cardXY?.y ?? 0}px; visibility: {cardXY ? 'visible' : 'hidden'}"
	>
		{#if lp.delta !== 0 || rankDelta}
			<!-- This-week summary: net points (colored by point delta) + rank move
			     (colored by rank delta). Independent signs — a player can gain rank
			     while losing points. -->
			<div class="flex items-center gap-2 text-xs font-medium tabular-nums">
				<span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">This week</span>
				{#if lp.delta !== 0}
					<span class={lp.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{signed(lp.delta)} pts</span>
				{/if}
				{#if rankDelta}
					<span class="flex items-center {rankDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
						{#if rankDelta > 0}<ArrowUp class="size-3" />{:else}<ArrowDown class="size-3" />{/if}{Math.abs(rankDelta)}
					</span>
				{/if}
			</div>
		{/if}
		{#if lp.live || lp.defending}
			<div class="flex gap-3 {lp.delta !== 0 || rankDelta ? 'border-t border-border pt-2' : ''}">
				{#if lp.live}
					<div class="min-w-40 flex-1">
						<Badge variant="secondary" class="mb-1 h-4 text-[10px] font-bold uppercase text-green-600 bg-green-500/10">Live</Badge>
						<TournamentCard result={lp.live} resultLabel={lp.live.result} pts={lp.live.points_earned} ptsClass="font-semibold text-primary" />
					</div>
				{/if}
				{#if lp.defending}
					<div class="min-w-40 flex-1 {lp.live ? 'border-l border-border pl-3' : ''}">
						<Badge variant="secondary" class="mb-1 h-4 text-[10px] font-bold uppercase text-muted-foreground">Defending</Badge>
						<TournamentCard result={lp.defending} resultLabel={lp.defending.result} pts={lp.defending.points_earned} ptsClass="font-semibold text-muted-foreground" />
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
