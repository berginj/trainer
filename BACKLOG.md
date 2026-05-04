# Trainer MVP Backlog

Status values:

- `Done`: implemented and passing local verification.
- `In Progress`: partially implemented; more work remains.
- `Blocked`: requires external setup, credentials, legal review, or cloud resources.
- `Todo`: not started.

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

## Remaining Product Work

| Item | Status | Done Criteria |
|---|---|---|
| Interactive workflow forms | Done | Org, team, roster, baseline, readiness, workload, routines, reports, goals, consent, benchmark import, alert status, and roster assignment can be submitted from UI. |
| Player dashboard UI | In Progress | API payload viewer exists; role-aware polished dashboard UI remains. |
| Team dashboard UI | In Progress | API payload viewer exists; role-aware polished coach dashboard UI remains. |
| Guardian dashboard UI | Todo | Guardian sees linked player, weekly plan, alerts, reports, and consent state. |
| Admin dashboard UI | Todo | Admin sees metric definitions, consent gaps, alerts, audit events, and benchmark coverage. |
| Consent workflow | In Progress | Consent can be recorded with audit events; sensitive player routes enforce consent when `AUTH_ENFORCEMENT=on`. |
| Alert resolution workflow | Done | Alerts can be acknowledged/resolved with audit events. |
| Benchmark import | Done | `POST /api/benchmarks/import` exists with validation, audit, and confidence guards. |
| Goal workflow | In Progress | Goals can be created; update/list/dashboard rendering remains. |
| Team roster assignment API | Done | Players can be assigned to teams from UI/API. |
| Google Calendar appointment sync foundation | In Progress | OAuth connection, calendar selection, event import, dedupe, appointment records, and trainer review APIs exist; production polling against Google and token refresh hardening remain. |
| Appointment-athlete matching workflow | Done | Exact email/name matches, fuzzy recommendations, trainer confirm/create/ignore flows, and tests exist. |
| Weather/reschedule notice workflow | In Progress | Change notices and email payload preparation exist; actual email provider delivery remains. |
| Venmo CSV reconciliation foundation | Done | CSV import, normalization, match recommendations, transaction review APIs, UI, and tests exist without scraping or unofficial APIs. |
| GameChanger stats import foundation | In Progress | Official-export plan, CSV parser, player-match recommendations, dedupe keys, persistence schema, import/list/review APIs, workflow UI, and tests exist; schedule-game mapping, season-total deltas, workload derivation, and DB-backed route tests remain. |

## Remaining Business Rules

| Item | Status | Done Criteria |
|---|---|---|
| Workload-entry alert persistence | In Progress | Workload entry creation persists baseball daily-max and softball exposure alerts; baseball rest-window availability still needs schedule context. |
| Pain routine suppression | Done | Baseball/softball routine assignment is blocked while relevant pain alerts are open. |
| Missed warm-up alert | In Progress | Rule function exists; persistence needs warm-up completion field/source data. |
| Routine non-compliance alert | In Progress | Rule function exists; persistence needs scheduled routine compliance aggregation. |
| Growth plus symptom alert | In Progress | Rule function exists; persistence needs height trend/performance-drop aggregation. |
| Goal reset due flag | Done | Due goals create blue informational flags in recompute. |
| Duplicate alert control | Done | Recompute avoids creating repeated open alerts for the same player/rule/source. |

## Remaining Data And Testing Work

| Item | Status | Done Criteria |
|---|---|---|
| Real PostgreSQL database | Blocked | `DATABASE_URL` configured locally or in Azure. |
| Prisma migrations | In Progress | Baseline and calendar/payment migration files exist; apply them against PostgreSQL with `npm run prisma:migrate:deploy`. |
| Seed execution | Blocked | `npm run prisma:seed` succeeds against PostgreSQL. |
| API integration tests | Blocked | Test database validates create/read/report/alert flows. |
| Calendar/payment route integration tests | Blocked | PostgreSQL-backed tests validate tenant boundaries, dedupe, appointment matching persistence, notices, and payment reconciliation persistence. |
| E2E tests | Todo | Playwright covers org setup -> roster -> readiness -> workload -> routine -> report. |
| Accessibility checks | Todo | Key forms and dashboards pass keyboard, labels, focus, and contrast checks. |
| Docker image validation | Blocked | Docker engine or CI runner builds and smoke-tests image. |

## Remaining Auth, Privacy, And Security Work

| Item | Status | Done Criteria |
|---|---|---|
| Entra External ID integration | Todo | Login, callback, session, claims, and user mapping are implemented. |
| API authorization middleware | In Progress | Guard helpers protect sensitive player/workload/report/routine routes when `AUTH_ENFORCEMENT=on`; Entra claim mapping and full route coverage remain. |
| Cross-tenant denial tests | In Progress | Guard-level tests prove denial; DB-backed route integration tests remain blocked by PostgreSQL. |
| Missing-consent denial tests | In Progress | Guard-level tests prove denial; DB-backed route integration tests remain blocked by PostgreSQL. |
| Legal/privacy review | Blocked | Child privacy and verifiable parental consent flow approved before production. |
| Data retention/delete/export | Todo | Retention, deletion, and export behavior are implemented and documented. |
| Google token rotation and refresh | Blocked | Azure Key Vault or production secret policy is configured; expired Google access tokens refresh without exposing token values. |
| Email provider integration | Blocked | Azure Communication Services or approved email provider sends prepared appointment change notices with delivery audit. |

## Remaining Azure And Operations Work

| Item | Status | Done Criteria |
|---|---|---|
| Bicep infrastructure | Todo | ACA, ACR, PostgreSQL, Blob, Service Bus, Key Vault, App Config, Front Door/WAF, Monitor. |
| GitHub OIDC deployment | In Progress | Manual workflow scaffold exists; live OIDC configuration remains. |
| ACR image push | In Progress | Workflow builds and pushes immutable image tags once ACR variables are configured. |
| Migration release gate | In Progress | Workflow gate runs `npm run prisma:migrate:deploy`; live validation waits on configured Azure `DATABASE_URL`. |
| Smoke tests | In Progress | Workflow checks health endpoints after deploy once `APP_BASE_URL` is configured. |
| Azure Monitor alerts | Todo | Error, latency, queue, DB, auth, deployment, and report failures alert operators. |
| Runbooks | Todo | Rollback, restore, DLQ replay, secret rotation, consent incident, data exposure. |
| Backup/restore drill | Blocked | Azure PostgreSQL exists and restore drill is validated. |
