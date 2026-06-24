# API Notes

## tennisapi1 (RapidAPI — fluis.lacasse) — used 2026-06-16, abandoned (rate limit too tight on BASIC)

Host: `tennisapi1.p.rapidapi.com`
Auth headers: `x-rapidapi-key`, `x-rapidapi-host`.

### Plan limits

- BASIC (free) = ~1 req/sec hard cap. 429 on burst.
- Refresh of top 10 × 2 tours = ~80 calls + 2 rankings = 82 calls. At 1.1s/call serial → ~90s per refresh. Exceeded daily quota fast during dev iteration.

### Endpoints

| Endpoint | Returns | Notes |
|---|---|---|
| `/api/tennis/rankings/atp` \| `/wta` | `{rankings: [...]}` — top players, ranked | Big response (~500KB). Each entry has `team.id`, `team.name`, `team.country.{name,alpha2}`, `ranking`, `points`, `previousRanking`, `previousPoints`, `tournamentsPlayed`. |
| `/api/tennis/player/{playerId}/events/previous/{page}` | `{events: [...], hasNextPage: bool}` | 30 events/page, chronological within page (oldest→newest). Page 0 = most recent batch. Top players: ~3-4 pages cover 12 months. |
| `/api/tennis/team/{playerId}` | Player meta | Same shape as ranking row's `team` field. |

Tried-and-failed paths (returned `{"message":"Endpoint '...' does not exist"}`):
- `/api/tennis/team/{id}/tournaments/last/{page}`
- `/api/tennis/team/{id}/events/last/{page}`

### Event object schema (per `events[i]`)

```json
{
  "id": 12345,
  "status": { "code": 100, "description": "Ended", "type": "finished" },
  "startTimestamp": 1773346200,                    // match start, Unix seconds
  "winnerCode": 1,                                 // 1=home wins, 2=away wins
  "homeTeam": { "id": 206570, "name": "...", "country": {...} },
  "awayTeam": { "id": 412818, ... },
  "homeScore": {...}, "awayScore": {...},
  "roundInfo": {
    "round": 27,                                   // numeric code (varies by draw size)
    "name": "Quarterfinals",                       // RELIABLE: "Final" | "Semifinals" | "Quarterfinals" | "Round of 16/32/64/128"
    "slug": "quarterfinals",
    "cupRoundType": 4
  },
  "tournament": {
    "id": 176052,
    "name": "Indian Wells, USA",                   // includes location suffix
    "slug": "...",
    "category": { "name": "ATP", "id": 3 },        // "ATP" | "WTA" | "Challenger" | ...
    "startTimestamp": 1772582400,                  // tournament dates (Unix sec)
    "endTimestamp": 1773532800,
    "uniqueTournament": {                          // PARENT tournament across seasons
      "id": 2487,
      "name": "Indian Wells",                      // clean name (no location)
      "tennisPoints": 1000,                        // <<< WINNER'S POINTS, derive event_type from this
      "category": { "name": "ATP" },
      "groundType": "Hardcourt outdoor",
      "primaryColorHex": "#f3bd2a"
    }
  }
}
```

### Schema gotchas

- `roundInfo` is **missing** on some events (qualifying, exhibition, walkover?). Must filter `e.roundInfo?.name`.
- `uniqueTournament` nests **inside** `tournament`, not at event top level.
- `uniqueTournament.tennisPoints` is the W (winner) points value. Use to derive event_type:
  - 2000 → Grand Slam
  - 1000 → 1000
  - 500 → 500
  - 250 → 250
- Doubles events appear in the `previous` feed. Filter by checking the player ID is one of `homeTeam.id` / `awayTeam.id` directly (doubles uses team IDs ≠ player ID).
- Some events lack `tennisPoints` (probably non-tour events) — default to 250 or skip.

### Derivation logic (worked correctly)

1. Group events by `tournament.id`.
2. Per tournament: find the event with the deepest round (highest position in W>F>SF>QF>R16>R32>R64>R128).
3. Determine if player won the deepest event:
   - `playerWon = (homeTeam.id === playerId && winnerCode === 1) || (awayTeam.id === playerId && winnerCode === 2)`
4. Map result code:
   - Final + won → `W`
   - Final + lost → `F`
   - else → round name (`SF`, `QF`, `R16`, `R32`, `R64`)
5. Look up points from standardized ATP/WTA points table by `(tour, event_type, result)`. `tennisPoints` only gives the W value — for losses you need the full table.

### ATP/WTA points table used (post-2024 reform)

```ts
atp: {
  'Grand Slam': { W: 2000, F: 1300, SF: 800, QF: 400, R16: 200, R32: 100, R64: 50 },
  '1000':      { W: 1000, F: 650, SF: 400, QF: 200, R16: 100, R32: 50, R64: 30 },
  '500':       { W: 500, F: 330, SF: 200, QF: 100, R16: 50, R32: 25 },
  '250':       { W: 250, F: 165, SF: 100, QF: 50, R16: 25 }
},
wta: {
  'Grand Slam': { W: 2000, F: 1300, SF: 780, QF: 430, R16: 240, R32: 130, R64: 70 },
  '1000':      { W: 1000, F: 650, SF: 390, QF: 215, R16: 120, R32: 65, R64: 10 },
  '500':       { W: 500, F: 325, SF: 195, QF: 108, R16: 60 },
  '250':       { W: 250, F: 163, SF: 98, QF: 54, R16: 30 }
}
```

### Pagination

`hasNextPage: boolean` at top of response. Stop early when `events[0].tournament.startTimestamp < cutoff` (cutoff = 12 months ago Unix sec).

### Why we left

Per-second rate limit on BASIC made full refresh take ~90s even with throttle. One full refresh consumed a noticeable chunk of daily quota during iteration; cron firing hourly would have burned through it. Going to evaluate `tennis-api-atp-wta-itf` (jjrm365) instead — see below.

---

## tennis-api-atp-wta-itf (RapidAPI — jjrm365) — adopted 2026-06-16

Host: `tennis-api-atp-wta-itf.p.rapidapi.com`
Auth headers: `x-rapidapi-key`, `x-rapidapi-host`.
98 endpoints total. Discoverable via MCP gateway (`mcp.rapidapi.com` with `x-api-host` + `x-api-key` headers — note `x-api-*` for MCP vs `x-rapidapi-*` for REST).
docs: https://docs.tennis-api.com/

### Endpoints we use

| Endpoint | Returns |
|---|---|
| `GET /tennis/v2/ms-api/ranking/{tour}?date=DD.MM.YYYY&group=singles` | top 100 entries `{position, pts, player:{id, name, countryAcr}}`. `date` MUST be a Monday (ATP/WTA publication day). Group must be `singles` or `doubles`. |
| `GET /tennis/v2/ms-api/profile/{encodedName}/matches-played?limit=100` | `{singles, doubles, qualifying, singlesCount}`. Each match: `{roundId, result, date, player1Id, player2Id, tournamentId, player1, player2, tournament, h2h}`. **NO `match_winner` field** — derive from set scores in `result` string. |
| `GET /tennis/v2/ms-api/profile/{encodedName}/filters` | round/level/court ID lookups |

`encodedName` = `encodeURIComponent(name.toLowerCase())` e.g. `jannik%20sinner`. Case-insensitive but space-required (NOT hyphenated).

### Other useful endpoints

- `GET /tennis/v2/ms-api/profile/search/{query}/{tour}` — name search, returns full names
- `GET /tennis/v2/ms-api/calendar/{tour}/{year}` — full season calendar
- `GET /tennis/v2/ms-api/tournament/{tour}/{name}/{year}/points` — official points table per tournament (often nulls though)
- `GET /tennis/v2/ms-api/tournament/{tour}/{name}/{year}/draws` — full draw
- `GET /tennis/v2/{tour}/player/finals/{playerId}` — every final reached in career (with tournament tier)
- `GET /tennis/v2/{tour}/player/past-matches/{playerId}` — ONLY 10 most recent matches, NO pagination params work
- `GET /tennis/v2/{tour}/player/titles/{playerId}` — career title counts by tier

### Round ID mapping (from `/filters` endpoint)

| ID | Name | Maps to |
|---|---|---|
| 12 | Final | W or F |
| 10 | 1/2 | SF |
| 9, 24 | 1/4 | QF |
| 7 | Fourth | R16 |
| 6 | Third | R32 |
| 5 | Second | R64 |
| 4 | First | R128 (collapse to R64 in our MatchResult type) |
| 0-3 | Pre-q / Q1-Q3 | filter out |
| 8 | Robin | round-robin (Tour Finals) |
| 11 | Bronze | Olympic 3rd place |
| 13-17 | Rubber 1-5 | Davis Cup |

### Level / tier mapping (from `tournament.tier`)

- `"Grand Slam"` → Grand Slam (W = 2000)
- `"Masters series"` → 1000
- `"Tour finals"` → 1000 (close enough for year-end finals)
- `"Main tour"` → 250 or 500 — `tier` doesn't distinguish. Use a hardcoded slug set against `tournament.reserveChar` (clean slug).
- `"Davis/Fed Cup"`, `"Olympics"`, etc. → skip

### Winner detection (no `match_winner` field on `matches-played`)

Parse `result` string e.g. `"3-6 2-6 7-5 6-1 6-1"`:
- Split by space, each set `"a-b"`
- Player1 wins set if `a > b`, else player2
- Match winner = player who won more sets

Edge cases:
- Tiebreaks `7-6(5)` → use first number (`7-6` wins for player1, `6-7` wins for player2)
- Retirements / incomplete → may have partial scores; treat majority wins
- Empty / weird formats → return null, skip match

### Points field quirk

- ATP `pts` = real ATP ranking points (Sinner: 13500 ≈ correct)
- WTA `pts` = ranking points × 100 (Sabalenka: 909000, divide by 100 → 9090 ≈ correct)

### Rankings date

Must be the most recent Monday (publication day). Computed in `mostRecentMonday()`. Format `DD.MM.YYYY`.

### Country codes

`countryAcr` = ISO 3-letter (ITA, ESP, GER). Our UI uses ISO 2-letter for flag emojis. Conversion table inlined in `tennis-api.ts` (~50 top tennis countries).

### Performance (old per-player model — superseded)

- 1 rankings call + 10 player calls per tour = 22 calls total for full refresh
- At 1.1s rate limit interval (BASIC plan safety margin): ~13s end-to-end refresh
- Only covered top 10; scaled with player count.

---

## Tournament-centric model (adopted 2026-06-23) — current

Replaces the per-player approach. Scales with *tournament* count (fixed ~60/tour), not
players, and gives the full field. See `src/lib/server/etl.ts` + `docs/ROADMAP.md`.

### Endpoints

| Endpoint | Returns | Notes |
|---|---|---|
| `GET /tennis/v2/{type}/tournament/calendar/{year}` | all events for a year: `{id, name, date, tier, court, country}` | `date` = start. `tier`: `Grand Slam` / `Masters series` / `Main tour` / `Finals` / `Future` / `Challenger`. Filter to tour-level by tier. |
| `GET /tennis/v2/{type}/tournament/results/{tourId}` | `{data:{singles,doubles,qualifying}}`, full draw | **Has `match_winner`** (no set-score parsing). Each match: `{roundId, player1Id, player2Id, match_winner, date, result}`. ~112KB/event. |
| `GET /tennis/v2/{type}/tournament/info/{tourId}` | tier, court, round, country | `?include=rating` *should* add points-per-round — UNVERIFIED via MCP, not wired. |

### Things that DON'T work for tier resolution

- `…/tournament/{name}/{year}/points` (Tournament_Points_Breakdown) → **all nulls**. Useless.
- Calendar/info `tier` reports both 250 and 500 as `"Main tour"`. No field separates them.
  → keep the hardcoded `SLUGS_500` set. Known limitation.

### Why this wins

- 1 results call per tournament = every player's path, with winner. Kills `parseWinner()`.
- Finished tournaments are immutable → archived once (`static/data/archive/`), never re-fetched.
  Steady-state refresh = only the current week's events (~1-3 calls/run).
- Full field (top 100), not just top 10.

### Build model

- Offline script `npm run refresh:data` (tsx, reads `process.env.RAPIDAPI_KEY`) → writes
  `static/data/{tour}.json`. Runtime only reads that JSON — no API key in the app.
- First build ~60 fetches/tour (~70s); too slow for a serverless request, hence offline.
- Scheduled via GitHub Action (`.github/workflows/refresh-data.yml`), commits the data.
  Vercel Cron retired (can't persist writes; per-request build busts the timeout).
- Keep the `ranking/{tour}` call for official rank + total points (≠ sum of derived).
