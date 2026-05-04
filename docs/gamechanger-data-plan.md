# GameChanger Data Integration Plan

This plan keeps the product on official GameChanger export and calendar-sync paths. There is no public GameChanger API documented for the workflows we need, so the product should not depend on scraping, credential sharing, or private endpoints.

## Sources Reviewed

- [Exporting Season Stats](https://help.gc.com/hc/en-us/articles/360043583651-Exporting-Season-Stats): Staff on baseball, softball, and basketball teams can export season totals as CSV. Exported CSV respects active stat filters.
- [Stat Filters](https://help.gc.com/hc/en-us/articles/360043142972-Stat-Filters): baseball, basketball, and softball staff can filter stats to selected games before export.
- [Integrating Your Personal Calendar](https://help.gc.com/hc/en-us/articles/115005457626-Integrating-Your-Personal-Calendar): GameChanger can sync team events to iOS or Google calendars. Staff, players, and guardian accounts receive all events; followers receive games only.
- [View and Share Box Score PDFs](https://help.gc.com/hc/en-us/articles/360061146972-View-and-Share-Box-Score-PDFs): staff can export game box score PDFs. Basketball supports iOS and Android; baseball and softball are iOS-only.
- [Print Options in GameChanger](https://help.gc.com/hc/en-us/articles/360058489071-Print-Options-in-GameChanger): export/share options include stats, scorebook, starting lineup, and box scores.
- [MaxPreps Manual Stat Upload](https://help.gc.com/hc/en-us/articles/11298180524685-MaxPreps-Manual-Stat-Upload): high school teams can export per-game TXT files for MaxPreps after scoring a game.
- [XML Export (College Teams Only)](https://help.gc.com/hc/en-us/articles/24581262301453-XML-Export-College-Teams-Only): college baseball and softball teams can export game stats as XML.

## Recommended Product Path

The strongest delivery path is a hybrid of automated schedule sync and staff-assisted stat exports:

1. A coach, team staff member, or parent with Staff access connects the GameChanger schedule to Google Calendar.
2. The existing Google Calendar integration imports team events and maps them to internal teams and games.
3. After each game, staff applies a one-game stat filter in GameChanger and exports the team stats CSV.
4. Staff pastes or uploads that CSV into Trainer.
5. Trainer normalizes the rows, matches GameChanger player names to internal players, detects duplicates, and stores one immutable import batch plus per-player stat lines.
6. If staff cannot export a game-filtered CSV, they upload a weekly season-total CSV. Trainer computes deltas against the last accepted season-total import and flags ambiguous corrections.

This gives us automation where GameChanger supports it, and clear human handoff where GameChanger only exposes files.

## What Parents Or Staff Paste Periodically

| Cadence | Required input | Who can usually provide it | Notes |
|---|---|---|---|
| Once per team | Team sport, team name, season, and first GameChanger stats CSV | GameChanger Staff account | Seeds roster candidates and player aliases. |
| Once per team, then rarely | Google Calendar subscription or selected synced calendar | Staff, player, or guardian account | Staff/player/guardian accounts include practices and games; follower accounts include games only. Google subscribed calendars may lag GameChanger changes. |
| After each game, preferred | Game-filtered GameChanger stats CSV | GameChanger Staff account | Best source for per-game stats such as baseball hits/pitching, softball pitching/fielding, basketball shots/points/rebounds/assists. |
| Weekly fallback | Current season-total stats CSV | GameChanger Staff account | Trainer can calculate deltas, but corrections and missing games need review. |
| Exception path | Box score PDF, MaxPreps TXT, or college XML | Staff account, platform-dependent | Useful when CSV is unavailable or for richer game-specific context. TXT/XML paths are limited by team level and sport. |

Normal parent follower access is not enough for reliable stat automation. At least one Staff account per team should be part of the workflow.

## Data Model

These entities are implemented for persisted imports:

- `ExternalSportsSource`: organization-level source record with provider `gamechanger`, status, sport, and source policy metadata.
- `ExternalTeamIdentity`: maps a GameChanger team label/calendar/feed to an internal `Team`.
- `ExternalPlayerIdentity`: maps GameChanger player names, aliases, jersey numbers, and source IDs when present to internal `Player` records.
- `ExternalGame`: stores schedule/game identity, opponent, start time, status, source calendar event ID, and source metadata.
- `SportStatImportBatch`: immutable file import with source type, file hash, scope, row counts, imported-by user, and review status.
- `PlayerGameStatLine`: normalized per-player, per-game stat payload linked to `Player`, `Team`, optional `ExternalGame`, and import batch.
- `PlayerSeasonStatSnapshot`: optional season-total snapshot used to calculate weekly deltas and correction reviews.

Do not force GameChanger box scores into `Measurement` directly. Keep source stats in a sport-stat layer, then derive workload and development measurements only from reviewed mappings.

## Delivery Tasks And Definition Of Done

| Task | Definition of Done |
|---|---|
| Source policy and permissions | Product copy states Staff access is required for stats, follower access is schedule-limited, and the app does not ask for GameChanger passwords or scrape private pages. |
| Stats CSV preview foundation | CSV paste/upload parses baseball, softball, and basketball rows; player name and jersey columns are detected; known metrics are normalized; rejected rows are returned without throwing; tests cover shot attempts, baseball/softball hitting, pitching, missing player names, and empty CSV. |
| Persistent import schema | Prisma models and migrations exist for source, external team/player identities, games, import batches, stat lines, and season snapshots; unique constraints prevent duplicate file/game imports. |
| Staff import API | Authenticated staff can create an import batch; rows are matched to team players; ambiguous rows enter review; accepted rows persist with raw source metadata and audit events. |
| Roster matching review | UI shows exact matches, recommended matches, unmatched rows, jersey/name conflicts, and lets staff confirm aliases; confirmed aliases are reused on later imports. |
| Schedule sync mapping | Google Calendar imported events can be assigned to internal teams and external games; updates/cancellations do not duplicate games; known Google subscription lag is visible in sync status. |
| Game-filtered CSV flow | Staff can select a known scheduled game, paste a filtered CSV, preview parsed rows, resolve matches, and persist per-player stat lines. |
| Season-total delta flow | Staff can paste a season-total CSV; Trainer compares it to the last accepted snapshot; new deltas are proposed; negative deltas or changed historical totals require review. |
| Sport stat dictionaries | Baseball, softball, and basketball metric dictionaries cover common GameChanger headers and preserve unknown columns in raw metadata. |
| Workload derivation | Reviewed stat lines can create safe workload entries where appropriate, such as pitches/innings for baseball and softball and minutes for basketball, without creating medical claims. |
| Tests and operations | Unit tests cover parser/matching/dedupe; DB-backed route tests cover tenant boundaries and duplicate imports; audit events include file hash, team, sport, row counts, and user. |

## Current Implementation Status

The import foundation is implemented:

- `POST /api/integrations/gamechanger/stats/preview` validates a pasted CSV against an internal team and sport, parses rows, returns metric normalization, recommends player matches, and writes an audit event.
- `POST /api/integrations/gamechanger/stats/import` creates immutable import batches, external source/team identity records, optional external games, per-player stat lines, and season-total snapshots.
- `GET /api/integrations/gamechanger/stats/import` lists recent import batches with their stat lines and match state.
- `POST /api/integrations/gamechanger/stat-lines/{id}/match` lets staff confirm or ignore player matches and persists confirmed GameChanger aliases.
- `src/lib/gamechanger-import.ts` parses CSV content, normalizes common baseball, softball, and basketball stat headers, recommends safe player matches, and builds deterministic dedupe keys.
- Downstream workload derivation and report rendering are intentionally not automatic yet; reviewed stat lines should feed those surfaces in a later slice.
