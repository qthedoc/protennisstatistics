# AGENTS.md — ProTennisStatistics

Agent instructions for this repo. Read before touching anything.

---

## What this is

SvelteKit app visualizing ATP/WTA rankings as a per-tournament bar chart — each bar = points earned at one event over the last 52 weeks. Key differentiator: shows both earned points and upcoming defenses on a single timeline.

Live at ProTennisStatistics.com.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Svelte 5 (runes), SvelteKit 2, Tailwind CSS 4 |
| Icons | `@lucide/svelte` |
| UI primitives | shadcn-svelte, bits-ui |
| Type system | TypeScript (strict, bundler module resolution) |
| Runtime | Node.js / Vercel serverless |
| Data | Static JSON, prebuilt offline |
| API | RapidAPI `tennis-api-atp-wta-itf` (jjrm365) |
| CI | GitHub Actions |
| Package manager | pnpm |

---

## Architecture — read this carefully

### Core principle: offline build, static data

**No API calls happen at request time.** The build pipeline runs offline (`npm run refresh:data`), writes static JSON to `static/data/{tour}.json`, and the server just reads that file. This keeps the API key out of the runtime entirely and avoids serverless timeouts.

```
[GitHub Action, weekly] → npm run refresh:data → static/data/atp.json + wta.json
                                                                ↓
                                         [Vercel build] → prerendered pages
                                                                ↓
                                              [User] → reads pre-built HTML
```

### Data pipeline (src/lib/server/etl.ts)

1. Fetch calendar for current + previous year (2 calls/tour)
2. Filter to tour-level events in 12-month rolling window + 3-week lookahead buffer
3. Per tournament: fetch full draw results (one call — has `match_winner`, `roundId`, full field)
4. Condense to archive record: `{ playerId → { deepest_round, champion, draw-size-aware label } }`
5. Archive each **finished** tournament in `static/data/archive/{tour}/{tourId}.json` — immutable, never re-fetched
6. Fetch official ranking (rank, name, total points)
7. Pivot archive by playerId → `points_distribution[]` over 12 months
8. Write top 100 players to `static/data/{tour}.json`

Ongoing refreshes: only fetch tournaments not already in archive (~1–3 calls/run at steady state).

### Runtime (src/lib/server/tennis-api.ts)

- `getRankings(tour)` reads `static/data/{tour}.json` via `fs.readFile`
- In-memory 1h TTL cache (`Map<Tour, CacheEntry>`)
- **Do NOT use this in universal loads or client-side code** — it's Node-only. Use `fetch('/data/{tour}.json')` instead (works everywhere, including edge/serverless)

### Page rendering

- `rankings/atp` and `rankings/wta`: `prerender = true`, server load calls `getRankings()`
- Home page (`/`): `prerender = true`, universal load (`+page.ts`) fetches both `/data/atp.json` and `/data/wta.json` via SvelteKit `fetch`
- Home page shows rank-1 player (ATP or WTA) picked randomly client-side via `onMount`

---

## Key types (src/lib/types.ts)

```ts
interface Player {
  rank: number; name: string; country: string; country_code: string;
  current_points: number; points_distribution: TournamentResult[];
}

interface TournamentResult {
  event_name: string; event_type: EventType; event_date_start: string;
  event_date_end: string; result: MatchResult; points_earned: number;
}

type EventType = 'Grand Slam' | '1000' | '500' | '250' | 'Other';
type MatchResult = 'W' | 'F' | 'SF' | 'QF' | 'R16' | 'R32' | 'R64';
```

---

## Component conventions

### Svelte 5 runes

Always use runes — `$state`, `$derived`, `$effect`, `$props`. No legacy `export let`.

```svelte
<script lang="ts">
  let { player, onselect }: { player: Player; onselect?: (name: string) => void } = $props();
  let isHovering = $state(false);
  const zoomed = $derived(isHovering || isSelected);
</script>
```

### Grid alignment — critical

`PlayerRow`, `RankingsHeader`, and page column headers all use the same grid template. **Keep these in sync**:

```
grid-cols-[3rem_1.5fr_6rem_minmax(0,1.5fr)]
```

If you change it in one place, change it in all three. `RankingsHeader.svelte` is the shared component.

### SVG logo components

`AtpLogo.svelte` and `WtaLogo.svelte` are inline SVG components that use `fill="currentColor"`. Color them via Tailwind `text-*` classes on the component. Do **not** use `<img>` for these — external SVGs can't inherit `currentColor`.

### PointsBarChart

- Uses `bind:clientWidth={containerW}` to size the SVG viewBox dynamically — bars always fill their column
- `earnedResults`: current-year events already played
- `defendResults`: last-year events projected into current-year dates, shown for upcoming defenses
- Both render identically (no faded styling for defend bars)
- Tooltip uses fixed positioning relative to `clientX/Y`

---

## File layout

```
src/
  lib/
    components/
      PointsBarChart.svelte   ← main visualization
      PlayerRow.svelte         ← single player row with chart
      RankingsHeader.svelte    ← shared column header
      Header.svelte            ← site header with logo + nav
      AtpLogo.svelte           ← inline SVG, currentColor
      WtaLogo.svelte           ← inline SVG, currentColor
    server/
      tennis-api.ts            ← getRankings(), fs-based, Node-only
      etl.ts                   ← full data pipeline, run offline
    types.ts
  routes/
    +layout.svelte             ← Header + background gradient
    +page.svelte               ← home, hero + example PlayerRow
    +page.ts                   ← universal load, prerender=true
    rankings/
      atp/+page.server.ts      ← loads atp snapshot
      atp/+page.svelte
      wta/+page.server.ts
      wta/+page.svelte
    api/cron/refresh/
      +server.ts               ← cache invalidation endpoint
static/
  data/
    atp.json                   ← prebuilt ATP snapshot (top 100)
    wta.json                   ← prebuilt WTA snapshot
    archive/
      atp/{tourId}.json        ← immutable tournament records
      wta/{tourId}.json
  images/
    logo.svg                   ← site logo (concept 8 design)
    tour-atp.svg               ← ATP tour logo (raw, used as reference)
    tour-wta.svg               ← WTA tour logo (raw, currentColor)
    gs-ao.png / gs-rg.png / gs-wimbledon.png / gs-uso.png
scripts/
  refresh-data.ts              ← CLI entry for ETL
docs/
  API_NOTES.md                 ← detailed API schema + gotchas
  ROADMAP.md                   ← feature roadmap
```

---

## Commands

```bash
pnpm dev                    # dev server
pnpm build                  # production build
pnpm check                  # svelte-check + tsc
pnpm refresh:data           # run ETL (needs RAPIDAPI_KEY in env)
```

---

## API — RapidAPI tennis-api-atp-wta-itf (jjrm365)

See `docs/API_NOTES.md` for full schema. Key points:

- **WTA points quirk**: API returns `pts × 100`. Normalize: `pts / 100` for WTA.
- **Rankings date**: must be most recent Monday (`DD.MM.YYYY`), computed via `mostRecentMonday()`.
- **Tier resolution**: calendar `tier` reports both 250 and 500 as `"Main tour"`. A hardcoded `SLUGS_500` set distinguishes them.
- **Round IDs**: `12=Final`, `10=SF`, `9/24=QF`, `7=R16`, `6=R32`, `5=R64`, `4=R128`. IDs 0–3 are qualifying — filter out.
- **Winner detection**: results endpoint has `match_winner` field (no set-score parsing needed).
- **Archive**: finished tournament results never re-fetched. Only the rolling tail is live.

Points table (post-2024 reform) is inlined in `etl.ts` — check there before hardcoding points.

---

## Environment variables

| Var | Purpose |
|---|---|
| `RAPIDAPI_KEY` | ETL only (offline script). Never exposed at runtime. |
| `CRON_SECRET` | Auth token for `POST /api/cron/refresh` |

---

## Design decisions — don't undo these

- **No API calls at request time.** If you need live data in a page load, use `fetch('/data/{tour}.json')` — not `getRankings()`.
- **`prerender = true` on all ranking pages.** They're static snapshots; no reason for SSR.
- **Home page uses universal load + `onMount` randomness**, not server load. This is intentional — server-side `Math.random()` on a prerendered page runs once at build time.
- **`tsconfig.json` has `allowArbitraryExtensions: true`** — required for Svelte's `.d.svelte.ts` generated types.
- **Defend bars render identically to earned bars.** No special faded styling.
- **`bind:clientWidth` on PointsBarChart container** — do not replace with a fixed `W` constant. The chart must fill its column.

---

## What NOT to do

- Don't call `getRankings()` from a universal load (`+page.ts`) or client code — it uses Node `fs`.
- Don't add `prerender = false` to ranking pages without a good reason.
- Don't add API calls to the request path — all data comes from prebuilt JSON.
- Don't hardcode `W = 400` back into PointsBarChart — it was changed to `containerW` for responsive filling.
- Don't use `<img>` for ATP/WTA logos — use the Svelte components.
- Don't change the grid template on PlayerRow without updating RankingsHeader and both page headers to match.
