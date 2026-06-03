# Trainer MVP Backlog

Status values:

- `Done`: implemented and passing local verification.
- `In Progress`: partially implemented; more work remains.
- `Blocked`: requires external setup, credentials, legal review, or cloud resources.
- `Todo`: not started.

## Current Verification Snapshot

Recorded June 2, 2026:

- Local `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` pass after the `/routines` assignment success-message fix.
- OAuth state-cookie validation now requires a matching state cookie, and OAuth return targets are normalized to same-origin relative paths.
- `tests/integration/db-backed-routes.test.ts` adds opt-in PostgreSQL-backed authorization coverage for tenant boundaries, missing consent, routine assignment, and report routes when `TEST_DATABASE_URL` is configured.
- Public dev health checks for `https://trainer-dev1.greenground-5002c3bc.eastus2.azurecontainerapps.io` return HTTP 200; database dependency health is OK.
- The dev auto-deploy workflow for `bf663b2` completed successfully and Azure Container Apps is serving revision `trainer-dev1--0000020`.
- The dev auto-deploy workflow now runs after successful `CI` completion on `main`, with manual dispatch still available.

## Current Done

| Item | Status | Notes |
|---|---|---|
| Build/deployment plan | Done | `BUILD_DEPLOYMENT_PLAN.md` defines Azure-only architecture and definitions of done. |
| App foundation | Done | Next.js, TypeScript, Tailwind, Prisma, Zod, Vitest, Dockerfile, CI. |
| Domain schema | Done | Prisma schema covers MVP entities and audit records. |
| Seed metadata | Done | Metric and routine seed definitions exist with tests. |
| Core create APIs | Done | Organizations, seasons, teams, players, guardians, evaluations, measurements, readiness, workload, routines, reports. |
| Dashboard APIs | Done | Player and team dashboard read models exist. |
| Safety rules | Done | Baseball rest, pain, softball exposure, readiness drop, workload spike, baseline/evaluation/benchmark flags. |
| Report snapshots | Done | Monthly player report snapshot is immutable and tested. |
| Dependency health endpoint | Done | `/api/health/dependencies` reports database/storage/queue readiness. |
| Static workflow UI | Done | Workflow pages exist for MVP areas. |

## Cyclones Basketball MVP Sprint

| Item | Status | Notes |
|---|---|---|
| Hybrid Google/Microsoft sign-in scaffold | Done | OAuth start/callback/logout routes issue signed app sessions and claim invites by email/token. |
| Invite-based role mapping | Done | Invites can activate guardian, coach, assistant, or evaluator access and link guardians to players; roster UI now creates guardian invite links while adding players. |
| Team branding | Done | Teams store display name, colors, and logo URL; setup/dashboard/home views expose brand metadata. |
| Coach assignment board | Done | Basketball routines can be selected by name and assigned to a team from `/routines`. |
| Guardian-assisted completion | Done | `/guardian/home` shows linked player assignments, consent gate, completion, skip, and pain reporting. |
| Single Azure MVP infrastructure | Done | `infra/main.bicep` provisions the lean Azure stack for one live environment. |
| Live Azure dev deployment | Done | `trainer-dev1` runs the app image on Azure Container Apps with Azure PostgreSQL and public health checks passing. |
| Microsoft sign-in live path | Done | Microsoft app registration, callback URL, signed state, session creation, and role mapping are working in Azure. |
| Bulk roster entry | Done | `/roster` loads the signed-in user's organizations/teams, can add multiple players to a team, and can create guardian invite links per player. |

## Remaining Product Work

| Item | Status | Done Criteria |
|---|---|---|
| Interactive workflow forms | Done | Org, team, roster, baseline, readiness, workload, routines, reports, goals, consent, benchmark import, alert status, and roster assignment can be submitted from UI. |
| Player dashboard UI | Done | Role-aware player dashboard shows status, readiness, routines, alerts, and next evaluation state. |
| Team dashboard UI | Done | Coach dashboard loads assigned teams, roster status, modify counts, and open alerts without manual IDs. |
| Report generation/view UI | Done | `/reports` loads signed-in org/team/player context, generates immutable player snapshots, lists recent reports, and `/reports/view` renders printable snapshots. |
| Guardian dashboard UI | Done | Guardian home shows linked players, consent state, alerts, weekly completion summary, latest report links, and routine completion/skip/pain actions. |
| Admin dashboard UI | Done | Admin summary shows roster count, consent gaps, guardian gaps, alert mix, metric coverage, weak benchmark count, alert/player drilldowns, weak benchmark rows, and recent audit events. |
| Consent workflow | In Progress | Consent can be recorded with audit events; player-scoped guards now support per-player consent and sensitive workload, goal, report, routine, readiness, measurement, alert, and dashboard routes enforce consent when `AUTH_ENFORCEMENT=on`; DB-backed route coverage remains. |
| Alert resolution workflow | Done | Alerts can be acknowledged/resolved with audit events. |
| Benchmark import | Done | `POST /api/benchmarks/import` exists with validation, audit, and confidence guards. |
| Goal workflow | Done | `/player/profile` loads signed-in context, creates goals, lists active/archived goals, updates goal status, and player dashboards render active goals. |
| Team roster assignment API | Done | Players can be assigned to teams from UI/API, including the bulk roster page. |
| Google Calendar appointment sync foundation | In Progress | OAuth connection, calendar selection, event import, dedupe, appointment records, and trainer review APIs exist; production polling against Google and token refresh hardening remain. |
| Appointment-athlete matching workflow | Done | Exact email/name matches, fuzzy recommendations, trainer confirm/create/ignore flows, and tests exist. |
| Weather/reschedule notice workflow | In Progress | Change notices and email payload preparation exist; actual email provider delivery remains. |
| Venmo CSV reconciliation foundation | Done | CSV import, normalization, match recommendations, transaction review APIs, UI, and tests exist without scraping or unofficial APIs. |
| GameChanger stats import foundation | In Progress | Official-export plan, CSV parser, player-match recommendations, dedupe keys, persistence schema, import/list/review APIs, workflow UI, and tests exist; schedule-game mapping, season-total deltas, workload derivation, and DB-backed route tests remain. |

## Remaining Business Rules

| Item | Status | Done Criteria |
|---|---|---|
| Workload-entry alert persistence | Done | Workload entry creation persists baseball daily-max, baseball rest-window conflicts from participation status, and softball exposure alerts. |
| Pain routine suppression | Done | Baseball/softball routine assignment is blocked while relevant pain alerts are open. |
| Missed warm-up alert | Done | Skipped completions for warm-up routines aggregate over the recent window and persist a duplicate-controlled missed warm-up alert. |
| Routine non-compliance alert | Done | Skipped routine completions aggregate by weekly bucket and persist a duplicate-controlled routine non-compliance alert after repeated missed weeks. |
| Growth plus symptom alert | Done | Measurement capture checks height trend with recent pain or known performance drops and persists a duplicate-controlled growth context alert. |
| Goal reset due flag | Done | Due goals create blue informational flags in recompute. |
| Duplicate alert control | Done | Recompute avoids creating repeated open alerts for the same player/rule/source. |

## Remaining Data And Testing Work

| Item | Status | Done Criteria |
|---|---|---|
| Real PostgreSQL database | Done | Azure PostgreSQL Flexible Server `trainer-dev1-pg` is configured for the dev Container App. |
| Prisma migrations | Done | All current migrations have been applied against Azure PostgreSQL. |
| Seed execution | Done | `npm run prisma:seed` succeeded against Azure PostgreSQL with Cyclones MVP seed data. |
| API integration tests | Blocked | Test database validates create/read/report/alert flows. |
| Calendar/payment route integration tests | Blocked | PostgreSQL-backed tests validate tenant boundaries, dedupe, appointment matching persistence, notices, and payment reconciliation persistence. |
| E2E tests | Done | Playwright covers signed-out states, mocked signed-in persona home, parent home, athlete co-view, and a mocked org setup -> roster -> readiness -> workload -> routine -> report journey in CI/release verification. |
| Accessibility checks | In Progress | Playwright checks keyboard entry, named controls, headings, and mobile overflow across core signed-out pages; deeper form focus/contrast automation remains. |
| Docker image validation | Done | ACR remote builds produce deployable images and public health smoke checks pass after rollout. |

## Remaining Auth, Privacy, And Security Work

| Item | Status | Done Criteria |
|---|---|---|
| Entra External ID integration | In Progress | Microsoft sign-in works through an app registration; full Entra External ID policy/tenant strategy remains. |
| API authorization middleware | In Progress | Guard helpers protect sensitive player/workload/report/routine/goal routes when `AUTH_ENFORCEMENT=on`, including team-scoped player writes; Entra claim mapping remains. |
| Cross-tenant denial tests | In Progress | Guard-level tests prove denial; opt-in PostgreSQL route tests cover cross-tenant denial when `TEST_DATABASE_URL` is configured. |
| Missing-consent denial tests | In Progress | Guard-level tests cover global and per-player consent denial plus team-scoped player writes; opt-in PostgreSQL route tests cover missing-consent denial when `TEST_DATABASE_URL` is configured. |
| Legal/privacy review | Blocked | Child privacy and verifiable parental consent flow approved before production. |
| Data retention/delete/export | In Progress | Tested lifecycle helpers define player export sections, deletion/disconnect plans, and retention candidate counts; executable privacy routes, documentation, and DB-backed validation remain. |
| Google token rotation and refresh | Blocked | Google OAuth clients and production secret policy are not configured; expired Google access tokens must refresh without exposing token values. |
| Email provider integration | Blocked | Azure Communication Services or approved email provider sends prepared appointment change notices with delivery audit. |

## Remaining Azure And Operations Work

| Item | Status | Done Criteria |
|---|---|---|
| Bicep infrastructure | In Progress | Live dev ACA, ACR, PostgreSQL, and Log Analytics resources exist; Blob, Service Bus, Key Vault, App Config, Front Door/WAF, and full Monitor still need rollout. |
| GitHub OIDC deployment | In Progress | Deployment identity has `Contributor` on `rg-trainer-dev`; dev auto-deploy runs after successful CI and still allows manual dispatch. |
| ACR image push | Done | ACR remote builds and pushes immutable image tags used by Container App revisions. |
| Migration release gate | In Progress | Manual migrations succeeded against Azure PostgreSQL; workflow gate still needs GitHub validation. |
| Smoke tests | Done | Manual public health and dependency checks pass; CI runs local Playwright smoke tests; dev auto-deploy checks health, dependency health, `/signin`, `/guardian/home`, and `/routines` after rollout. |
| Azure Monitor alerts | Todo | Error, latency, queue, DB, auth, deployment, and report failures alert operators. |
| Runbooks | Done | `docs/runbooks.md` covers rollback, restore, DLQ replay, secret rotation, consent incident, data exposure, deployment failures, and fielding checks. |
| Backup/restore drill | Todo | Azure PostgreSQL exists; restore drill still needs validation. |
