<script lang="ts">
	import { page } from '$app/state';
	import { Sun, Moon, Trophy } from '@lucide/svelte';

	let isDark = $state(false);

	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/rankings/atp', label: 'ATP' },
		{ href: '/rankings/wta', label: 'WTA' },
	];
</script>

<header class="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
	<div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
		<a href="/" class="flex items-center gap-2 font-semibold tracking-tight text-foreground">
			<div class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
				<Trophy class="size-4" />
			</div>
			<span class="hidden sm:inline">Pro Tennis Stats</span>
			<span class="sm:hidden">PTS</span>
		</a>

		<nav class="flex items-center gap-1">
			{#each navLinks as link}
				<a
					href={link.href}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {page.url.pathname === link.href
						? 'bg-muted text-foreground'
						: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
				>
					{link.label}
				</a>
			{/each}

			<div class="ml-1 h-5 w-px bg-border"></div>

			<button
				onclick={toggleTheme}
				class="ml-1 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Toggle theme"
			>
				{#if isDark}
					<Sun class="size-4" />
				{:else}
					<Moon class="size-4" />
				{/if}
			</button>
		</nav>
	</div>
</header>
