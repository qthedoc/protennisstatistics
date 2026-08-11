---
title: "Refresh degradation: calendar cap + empty ranking (two prod bugs)"
date_created: "2026-08-09"
date_updated: "2026-08-09"
description: "Why daily refreshes dropped most tournaments then zeroed the site; the fixes."
when_to_use: "Any time refresh:data produces too-few players/tournaments or an empty snapshot; before touching etl.ts fetchCalendar / loadOrFetchRanking / refreshTour pivot."
---

# 2026-08-09 — TWO REFRESH BUGS (calendar truncation + empty ranking)

Boss reported: (1) most tournaments missing in bar charts after recent refreshes; (2) prod `[500] GET /` `TypeError: Cannot read properties of undefined (reading 'name')` at `RankingsHeader.js` (really the home `<PlayerRow player={data.atpPlayer}>` — `atp.players[0]` undefined).

## Timeline (git, static/data/atp.json player/dist counts)
- 07-29 b547056: 100 players, avg 18.8 tournaments/player (Sinner 16). HEALTHY.
- 08-08 ccf1e1e: 100 players, avg **4.5** (Sinner 4). Bug 1 landed.
- 08-10 fe30b5f: **0 players**. Bug 2 landed → prod crash.
- ETL code UNCHANGED since bb4f607 (feat: live points) → both are DATA/API-shape regressions, not code edits.

## Bug 1 — calendar API caps at ~201 rows, date-DESCENDING (ignores pageSize)
`fetchCalendar` did ONE `page=1&pageSize=2000` call/year. Probed live 2026-08-09:
- `cal 2026 pageSize=2000` → count **201**, range 2026-07-06..2026-11-16 (NOT Jan–Dec).
- `cal 2025 pageSize=2000` → count 201, range 2025-09-29..2025-12-29.
- `page=2` → 2026-05-04..2026-07-06, `page=3` → 2026-02-16..2026-05-04. **Pagination WORKS**, ~201/page, date-desc.
Combined page-1 coverage = 2025-09-29..2026-11-16 → EXACTLY matches the 08-08 broken snapshot's tournament set. Gap = 2026 Jan–Jul (AO, IW, Miami, Madrid, Rome, RG, Wimbledon) + 2025 Jan–Sep (Cincy, USO).
**Key insight:** online path built the pivot input `inWindow` ONLY from THIS run's calendar candidates. Disk archives were FINE (76 atp files, 16 in-window w/ Sinner) but ignored. A truncated calendar silently drops most bars.

## Bug 2 — empty ranking archived + served
Daily cron (7f32eb1 changed refresh to daily) ran Mon 08-10 06:30 UTC. Rankings publish weekly Monday but LATE in the day. Probed: `ranking date=10.08.2026` → status 200, **rows 0**; `03.08.2026` → 100 rows. ETL fetched `[]`, ARCHIVED it (`rankings/atp/2026-08-10.json` = 92 bytes `data:[]`), built 0-player snapshot. Empty archive would keep being reused (0 API calls) until next Monday/`--force`.

## Fixes (etl.ts)
1. **Snapshot from ALL in-window disk archives**, not calendar candidates. Online path now does `readAllArchives` + window filter for the pivot (same as offline). Immune to calendar truncation — archived tournaments persist.
2. **Paginate `fetchCalendar`** until oldest date on page < window floor (or empty/cap). Discovers the full window, not just the recent 201.
3. **Empty-ranking guard** in `loadOrFetchRanking`: never archive `[]`; on empty fetch fall back to latest NON-EMPTY archived ranking. `loadLatestRanking` skips empty-data archives.
4. **0-player guard** in `finishSnapshot`: throw rather than write an empty snapshot (protects committed good data).
5. **Frontend defense** (`+page.ts` / home `+page.svelte`): tolerate empty players so a bad push can't 500 the homepage.

## Cleanup done
- Deleted empty `rankings/{atp,wta}/2026-08-10.json`.
- Rebuilt `static/data/{atp,wta}.json` via offline (uses 08-03 ranking + all archives) → full distributions restored.

## Call-count (boss asked — is the API cap a money grab? yes, probably)
API caps calendar at ~201 rows/page, so a full year = ~4 paged calls where 1 worked before. To NOT pay that daily: **deep pagination gated behind `--force`.**
- **Incremental (daily cron):** `calPages=1` → 1 calendar call/yr × 2yr × 2tours = **4 calendar calls, same as before.** New tournaments are always recent → on page 1; snapshot rebuilt from ALL archives regardless, so page-1 loses nothing. Daily API cost UNCHANGED (~8–10 calls).
- **`--force` (backfill / after >~5wk outage):** `calPages=12` → ~12 calendar calls + all results. Run manually when needed.

## 504 / transient-error hardening (added same session)
Live incremental run hit `ranking 504: gateway timed out` → OLD code (and my first fix) threw and crashed the whole refresh. Now:
- `rateLimitedFetch` retries **5xx** (not just 429) with the same backoff.
- `loadOrFetchRanking` wraps `fetchRanking` in try/catch: on throw OR empty → fall back to newest non-empty archived ranking. A ranking hiccup can no longer zero OR crash the refresh.
- Observed 2026-08-10: RapidAPI gateway was broadly 504-flaky (ranking + results), so an incremental re-run ground on retries — external API problem, not our code. On-disk data stayed the good version (snapshot only writes after ranking resolves).

## Round 2 — robustness review + tests + CI (2026-08-10)
Boss: codebase not robust enough; find other break points, add tight tests + CI; "outdated data better than wrong data".
More fragilities found & fixed in `etl.ts`:
- **Data-quality gate (the big one):** `validateSnapshot(snapshot)` (exported) + called in `writeSnapshot` → THROWS on degraded data (floors: `MIN_PLAYERS=90`, `MIN_TOTAL_BARS=800`; healthy = 100 players / ~1875 atp / ~1784 wta bars). One gate protects local + CI. A partial ranking (e.g. 12 rows) or a distribution collapse now fails the refresh step → commit skipped → last good data stays. Replaced the weaker `finishSnapshot` 0-player throw.
- **Fragile-archive fix:** the fetch loop now SKIPS `writeArchive` when a condensed draw has 0 players — a 200-with-empty-`singles` was being frozen as `finished` (never re-fetched) and, on `--force`, overwriting a good archive with an empty one.
- **Atomic snapshot write:** `writeSnapshot` writes `{tour}.json.tmp` then `rename` — a crash mid-write can't leave truncated JSON that 500s every page. `.tmp` gitignored.
- Deferred (low): `writePlayersMap` resets the accumulated id→name map to just this week's on a corrupt read.

**Testing/CI (two separate gates — answer to boss's Q):**
- **Code CI** `.github/workflows/ci.yml` (push/PR, `paths-ignore: static/data/**`): `pnpm check` + `pnpm test`. No API key. Blocks bad code.
- **Data CI** `.github/workflows/refresh-data.yml` (daily cron): refresh → `validateSnapshot` throws on bad data → build step fails → commit step skipped → outdated-but-good data kept. No workflow logic change needed; the throw does it.
- **Tests:** `vitest` (standalone `vitest.config.ts`, no SvelteKit plugin — etl's only `$lib` import is `import type`, erased). One file `src/lib/server/etl.test.ts`, 11 tests: `validateSnapshot` (healthy/empty/collapsed/malformed), `condenseTournament` (32-draw R32→W labels, alive flag, empty draw), `buildDistribution` (pivot/sort/points/live+out), `mapTier`. `pnpm test` = `vitest run`.
- Exported for tests: `validateSnapshot`, `condenseTournament`, `buildDistribution`, `mapTier`.
- Verified: `pnpm check` 0/0, `pnpm test` 11/11, offline rebuild writes 100/tour through the gate, gate proven to reject a collapsed snapshot while leaving the good file intact (1875 bars).

## Gotcha for future
`mostRecentMonday()` returns the CURRENT Monday; querying it before publication (early Monday UTC) returns `[]`. The empty-guard is the safety net — do NOT re-introduce archiving of empty ranking responses.
