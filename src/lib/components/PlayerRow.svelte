<script lang="ts">
	import type { Player } from '$lib/types';
	import PointsBarChart from './PointsBarChart.svelte';
	import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from '@lucide/svelte';

	let {
		player,
		selectedName = null,
		onselect,
	}: {
		player: Player;
		selectedName?: string | null;
		onselect?: (name: string | null) => void;
	} = $props();

	let isHovering = $state(false);
	const isSelected = $derived(selectedName === player.name);
	const zoomed = $derived(isHovering || isSelected);

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

	const rankColors: Record<number, string> = {
		1: 'text-amber-500 font-bold',
		2: 'text-slate-400 font-bold',
		3: 'text-amber-700 font-bold',
	};

	const SelectIcon = $derived(isSelected ? ChevronsDownUp : ChevronsUpDown);
</script>

<div
	role="button"
	tabindex="0"
	class="group grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50 md:grid-cols-[3rem_1.5fr_6rem_minmax(0,1.5fr)] {isSelected ? 'bg-muted/50 ring-1 ring-border' : ''}"
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

	<!-- Points — desktop only, col-3 slot -->
	<div class="hidden text-right md:block">
		<p class="text-sm font-bold tabular-nums text-foreground">{player.current_points.toLocaleString()}</p>
		<p class="text-xs text-muted-foreground">pts</p>
	</div>

	<!-- Bar Chart -->
	<div class="col-span-3 mt-1 md:col-span-1 md:mt-0">
		<PointsBarChart results={player.points_distribution} isHovering={zoomed} />
	</div>
</div>
