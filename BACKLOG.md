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
| Consent workflow | In Progress | Consent can be recorded with audit events; missing-consent enforcement is still pending auth middleware. |
| Alert resolution workflow | Done | Alerts can be acknowledged/resolved with audit events. |
| Benchmark import | Done | `POST /api/benchmarks/import` exists with validation, audit, and confidence guards. |
| Goal workflow | In Progress | Goals can be created; update/list/dashboard rendering remains. |
| Team roster assignment API | Done | Players can be assigned to teams from UI/API. |

## Remaining Business Rules

| Item | Status | Done Criteria |
|---|---|---|
| Workload-entry alert persistence | In Progress | Workload entry creation persists baseball daily-max and softball exposure alerts; baseball rest-window availability still needs schedule context. |
| Pain routine suppression | Done | Baseball/softball routine assignment is blocked while relevant pain alerts are open. |
| Missed warm-up alert | Todo | Repeated missed warm-up entries create yellow alert. |
| Routine non-compliance alert | Todo | Two-week non-compliance creates yellow alert. |
| Growth plus symptom alert | Todo | Rapid growth plus pain/performance drop creates yellow alert. |
| Goal reset due flag | Todo | Due goals create blue informational flag. |
| Duplicate alert control | Todo | Recompute avoids creating repeated open alerts for the same player/rule/source. |

## Remaining Data And Testing Work

| Item | Status | Done Criteria |
|---|---|---|
| Real PostgreSQL database | Blocked | `DATABASE_URL` configured locally or in Azure. |
| Prisma migrations | Blocked | Migration files generated and applied against PostgreSQL. |
| Seed execution | Blocked | `npm run prisma:seed` succeeds against PostgreSQL. |
| API integration tests | Blocked | Test database validates create/read/report/alert flows. |
| E2E tests | Todo | Playwright covers org setup -> roster -> readiness -> workload -> routine -> report. |
| Accessibility checks | Todo | Key forms and dashboards pass keyboard, labels, focus, and contrast checks. |
| Docker image validation | Blocked | Docker engine or CI runner builds and smoke-tests image. |

## Remaining Auth, Privacy, And Security Work

| Item | Status | Done Criteria |
|---|---|---|
| Entra External ID integration | Todo | Login, callback, session, claims, and user mapping are implemented. |
| API authorization middleware | In Progress | Request access context parser exists; route enforcement and Entra claim mapping remain. |
| Cross-tenant denial tests | Todo | Automated tests prove access is denied across organizations. |
| Missing-consent denial tests | Todo | Sensitive youth data collection/display is blocked without consent. |
| Legal/privacy review | Blocked | Child privacy and verifiable parental consent flow approved before production. |
| Data retention/delete/export | Todo | Retention, deletion, and export behavior are implemented and documented. |

## Remaining Azure And Operations Work

| Item | Status | Done Criteria |
|---|---|---|
| Bicep infrastructure | Todo | ACA, ACR, PostgreSQL, Blob, Service Bus, Key Vault, App Config, Front Door/WAF, Monitor. |
| GitHub OIDC deployment | In Progress | Manual workflow scaffold exists; live OIDC configuration remains. |
| ACR image push | In Progress | Workflow builds and pushes immutable image tags once ACR variables are configured. |
| Migration release gate | In Progress | Workflow gate exists; replace placeholder with `prisma migrate deploy` after migrations exist. |
| Smoke tests | In Progress | Workflow checks health endpoints after deploy once `APP_BASE_URL` is configured. |
| Azure Monitor alerts | Todo | Error, latency, queue, DB, auth, deployment, and report failures alert operators. |
| Runbooks | Todo | Rollback, restore, DLQ replay, secret rotation, consent incident, data exposure. |
| Backup/restore drill | Blocked | Azure PostgreSQL exists and restore drill is validated. |
