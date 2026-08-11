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

## Gotcha for future
`mostRecentMonday()` returns the CURRENT Monday; querying it before publication (early Monday UTC) returns `[]`. The empty-guard is the safety net — do NOT re-introduce archiving of empty ranking responses.
