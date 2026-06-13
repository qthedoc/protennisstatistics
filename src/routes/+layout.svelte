<script lang="ts">
	import "./layout.css";

	let { children } = $props();
</script>

<div class="relative min-h-screen overflow-x-hidden bg-background text-foreground">
	<div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,oklch(0.95_0.08_120/.65),transparent_45%),radial-gradient(circle_at_85%_5%,oklch(0.9_0.07_235/.5),transparent_45%),linear-gradient(180deg,oklch(1_0_0),oklch(0.99_0.005_210))] dark:bg-[radial-gradient(circle_at_20%_10%,oklch(0.3_0.08_120/.35),transparent_45%),radial-gradient(circle_at_85%_5%,oklch(0.35_0.07_235/.32),transparent_45%),linear-gradient(180deg,oklch(0.17_0.01_220),oklch(0.13_0.008_220))]"></div>

	<main class="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
		{@render children()}
	</main>
</div>
