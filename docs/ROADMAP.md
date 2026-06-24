# Pro Tennis Statistics Roadmap

There are various tennis statistics and visualizations that I want but do not exist in any of the current tennis apps and websites.

# Features:

## (Rankings) ATP and WTA Rankings with Distribution Bar Chart
each row is a player with their rank, country flag, name, current points as usual...
BUT unique to this app, we will show a small bar chart.
    - x-axis: last 12 months (rolling)
    - y-axis: points earned, 0 to max points earned at an event in the last 12 months
    - each bar represents points earned at an event, with the bar height representing the points earned and the color representing the type of event (e.g., Grand Slam, 1000, 500, 250, etc.)
    - tooltip on hover over each bar to show event name, logo, date(range), and result (i.e. W, F, SF, QF, R16, R32, R64, etc), and points earned 

## (Match) Minimum Points to Win for each player over the course of the match
- inspired by this animation: https://www.instagram.com/reel/DKuCgtOAdTK/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==
    - except we will show min point to win over the x-axis instead of an animation.

## (Match) Point stats
- point outcome in Sankey Diagram
    - first serve in -> win
    - first serve in -> lose
    - first serve out -> second serve in -> win
    - first serve out -> second serve in -> lose
- point outcome in pie charts
- probability matrix of winning point based on point score (e.g., 0-15, 15-30, etc)

---

# Data Architecture

## Principle: immutable archive + derived views

The system should never store *rankings*. It stores *tournaments* (immutable facts) and
**derives** rankings for any point in time. This makes the app time-navigable for free.

```
IMMUTABLE ARCHIVE (never delete)          DERIVED VIEW (disposable, rebuildable)
  every tournament ever          ─pivot→   RankingsSnapshot as-of-date X
  keyed by tour_id (API seasonid)          = tournaments ending in [X-52wk, X]
  frozen once status = finished            cached, regenerable anytime
```

"Rankings on 2019-07-01" = filter the archive to tournaments ending in the 52 weeks
before that date, then pivot on `playerId`. No separate history table — the archive *is*
the history.

### Source: tournament-centric, not player-centric

Use two endpoints instead of per-player calls:

- `GET /tennis/v2/{type}/tournament/results/{tourId}` — full draw in one call. Has
  `match_winner` (no set-score parsing needed), `roundId`, `player1Id`/`player2Id`.
- `GET /tennis/v2/{type}/tournament/info/{tourId}?include=rating` — tier, court, and
  actual points-per-round (replaces the hardcoded `POINTS_TABLE` and the 250-vs-500
  `SLUGS_500` guessing).

Finished tournaments are immutable → cache permanently, freeze, never re-fetch. Only the
current in-progress week needs refresh. Steady-state API cost ≈ a few tournaments/week.

Keep the `ranking/{tour}` call: official total points ≠ sum of derived points (best-18
rule, point drops, withdrawals). Use it for `rank` + `current_points`; use archive data
for the points *distribution* breakdown only.

### Future storage (NOT in MVP)

Vercel functions have an ephemeral filesystem, so a durable external store is needed once
we archive. Plan: **Turso (libSQL/SQLite)** — edge, cheap, indexed date-range queries.

```sql
tournaments                          -- immutable facts
  tour_id       INTEGER PRIMARY KEY  -- API seasonid, natural key
  tour          TEXT                 -- 'atp' | 'wta'
  name, tier, court TEXT
  start_date, end_date TEXT          -- end_date is the time-nav index
  status        TEXT                 -- 'finished' (frozen) | 'ongoing' (refresh)
  rating_json   TEXT                 -- points-per-round from ?include=rating

tournament_players                   -- condensed, one row per player per event
  tour_id       INTEGER
  player_id     INTEGER
  deepest_round INTEGER              -- roundId reached
  is_champion   BOOLEAN
  points        INTEGER
  PRIMARY KEY (tour_id, player_id)

players                              -- slowly-changing dim
  player_id     INTEGER PRIMARY KEY
  name, country_acr, ...
```

Index `(tour, end_date)`. Rules: upsert by `tour_id` (idempotent); freeze on
`status=finished`; key everything by integer `player_id`, never name; store raw
`match_winner`/`roundId` so derivation logic can change without re-fetching. The
third-party API serves any past season, so history can be lazily backfilled over time —
no urgent bulk import.

Volume is trivial: ATP+WTA ≈ 120 events/yr, ~10KB condensed each → ~36MB for 30 years.

## MVP (current)

- No database. In-memory module cache (`Map<Tour, CacheEntry>`, 1h TTL) +
  `static/data/{tour}.json` seed fallback when no API key.
- Tournament-centric fetch is the next step; archiving/Turso comes after.
- Edge cache (`s-maxage=3600, stale-while-revalidate=86400`) + hourly Vercel Cron keep
  clients off the upstream API.
