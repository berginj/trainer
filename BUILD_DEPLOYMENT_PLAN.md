# Youth Training Platform Build And Deployment Plan

## 1. Purpose

This document turns `deep-research-report.md` into an implementation-ready build and deployment plan for a youth training and performance tracking platform for ages 8 to 15.

The current repository is documentation-only. This file is the durable delivery contract for the next engineering phase. It defines product scope, role contracts, terminology, expected behavior, Azure architecture, delivery workstreams, definitions of done, test coverage, and deployment gates.

## 2. Source Inputs

Primary source:

- `deep-research-report.md`

External Azure and policy references used to validate the deployment plan:

- Microsoft Entra External ID: https://learn.microsoft.com/en-us/entra/external-id/external-identities-overview
- Azure Container Apps: https://learn.microsoft.com/en-us/azure/container-apps/start-serverless-containers
- Azure Container Apps scaling: https://learn.microsoft.com/en-us/azure/container-apps/scale-app
- Azure Container Apps jobs: https://learn.microsoft.com/en-us/azure/container-apps/jobs
- Azure Database for PostgreSQL backup and restore: https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-backup-restore
- Azure Database for PostgreSQL reliability: https://learn.microsoft.com/en-us/azure/reliability/reliability-database-postgresql
- Azure Service Bus: https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview
- Azure Key Vault: https://learn.microsoft.com/en-us/azure/key-vault/general/basic-concepts
- Azure Front Door WAF: https://learn.microsoft.com/en-us/azure/web-application-firewall/afds/afds-overview
- Azure App Configuration: https://learn.microsoft.com/en-us/azure/azure-app-configuration/overview
- Azure Bicep: https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/learn-bicep
- FTC COPPA guidance: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa

## 3. Fixed Planning Decisions

These are the default decisions for implementation. Changing any item requires an explicit architecture decision record.

| Decision | Choice |
|---|---|
| Cloud provider | Azure only |
| Deployment posture | Production MVP |
| Compliance posture | Wellness MVP with consent, privacy, and legal review gates |
| Identity | Microsoft Entra External ID |
| CI/CD | GitHub Actions deploying to Azure |
| Infrastructure as code | Bicep |
| Production region strategy | Single US Azure region for MVP |
| Runtime | Azure Container Apps |
| Database | Azure Database for PostgreSQL Flexible Server |
| ORM | Prisma |
| Frontend | Next.js, React, TypeScript |
| Backend | Next.js route handlers or API routes in the same app container |
| Validation | Zod |
| Background work | Azure Service Bus plus Container Apps workers/jobs |
| Storage | Azure Blob Storage |
| Secrets | Azure Key Vault |
| Feature flags | Azure App Configuration |
| Observability | Azure Monitor, Application Insights, Log Analytics |

## 4. MVP Scope

### 4.1 Build First

The MVP must include:

| Capability | Expected outcome |
|---|---|
| Multi-tenant organizations | Data and users are scoped to an organization. |
| Teams and seasons | Organizations can manage teams across dated seasons. |
| Player profiles | Coaches and guardians can view appropriate player information. |
| Guardian-linked accounts | Guardians can consent, view summaries, and support home workflows. |
| Coach and evaluator accounts | Staff can manage rosters, evaluations, workload, and routines. |
| Baseline evaluations | Evaluators can capture launch measurement sets. |
| Daily readiness checks | Sleep, soreness, pain, energy, mood, and notes can be captured. |
| Workload logging | Session minutes, RPE, throws, pitches, innings, and participation can be recorded. |
| Routine library | Admins can define safe sport-specific routines. |
| Routine assignment and completion | Coaches can assign routines and users can record completion. |
| Rules-based alerts | Pain, workload, rest, missing baseline, and benchmark-confidence flags are generated. |
| Dashboards | Player, guardian, coach, and admin dashboards answer their core workflow questions. |
| Monthly reports | Player and team report snapshots can be generated and stored. |
| Audit events | Sensitive changes are traceable. |
| Azure deployment | Infrastructure and app deployment are reproducible from CI/CD. |

### 4.2 Defer

These features are intentionally out of MVP:

| Feature | Reason |
|---|---|
| Native mobile apps | Responsive web/PWA is sufficient for MVP. |
| Wearable integrations | Manual entry should establish workflows first. |
| Markerless motion capture | Too complex and risky for initial safety-first product. |
| Automated video biomechanics | Not required to prove the core workflows. |
| Cross-organization benchmark marketplace | Requires stronger privacy and evidence controls. |
| Device-assisted capture | Can be added after manual data contracts stabilize. |
| Advanced workload analytics | Avoid false precision in youth athlete monitoring. |

### 4.3 Do Not Build

These are prohibited in the MVP:

| Prohibited behavior | Reason |
|---|---|
| Public player rankings | Creates comparison pressure and safety risk. |
| AI talent grades | Unsupported by the brief and inappropriate for youth development. |
| Injury prediction scores | Medical-risk implication without sufficient clinical basis. |
| Return-to-play decisions | Requires qualified medical judgment. |
| Medical or rehab recommendations | Product must remain wellness/development support. |
| Unverified benchmark auto-comparisons | Evidence quality varies by metric. |
| Public leaderboards for pain, readiness, body mass, or velocity | High misuse risk. |

## 5. Key Terms

These definitions are the shared contract for product, design, engineering, testing, and operations.

| Term | Definition |
|---|---|
| Organization | Tenant boundary for users, teams, seasons, players, benchmarks, routines, alerts, reports, feature flags, and settings. |
| Season | Dated operating period for team participation, evaluations, workload, and reports. |
| Team | Sport-specific roster inside one organization and season. |
| Player | Youth athlete profile linked to guardians and one or more teams. |
| Guardian | Adult account with consent authority and player visibility. |
| Coach | Staff account with assigned team and roster access. |
| Assistant coach | Staff account with limited team entry and review permissions. |
| Evaluator | Trainer or tester allowed to capture baselines, mobility screens, and measurements. |
| League admin | User who can view configured cross-organization reporting and compliance dashboards. |
| Platform admin | Internal operator with global configuration, audit, and platform health access. |
| Readiness | Short self-report about how prepared an athlete feels to train or compete. |
| Session RPE | Rating of how hard a session felt. |
| COD | Change of direction. |
| LTAD | Long-term athletic development. |
| PHV | Peak height velocity, the fastest period of adolescent growth. |
| MetricDefinition | Metadata contract for a metric, including unit, protocol, scope, visibility, confidence, benchmark policy, and ranking eligibility. |
| Measurement | Captured metric value tied to a metric definition and evaluation or session context. |
| Benchmark confidence | Product confidence in whether an external norm is solid enough to compare against. |
| Within-player trend | Comparison against the same athlete's prior results rather than a population norm. |
| Alert | Rules-based flag with severity, reason, source, status, and next safe action. |
| Report snapshot | Immutable generated report payload stored so historical reports do not change after later data changes. |

## 6. Role Contracts

Authorization must check all of these before returning or mutating athlete data:

| Check | Requirement |
|---|---|
| Identity | User is authenticated through Entra External ID. |
| Role | User has a role that permits the action. |
| Organization scope | User is a member of the target organization unless `platform_admin`. |
| Team scope | Team-level users only access assigned teams. |
| Player relationship | Guardian and player views require explicit relationship linkage. |
| Consent state | Health/readiness-related collection and display require required consent. |
| Record ownership | Every tenant-owned record must be constrained by organization scope. |

### 6.1 Platform Admin

Responsibilities:

- Manage global configuration and feature flags.
- Manage global metric and benchmark libraries.
- Review platform audit trails.
- Review platform health and operations dashboards.
- Support incident response and production operations.

Restrictions:

- Must not casually access child data outside support or audit workflows.
- Must be subject to explicit audit logging for sensitive reads and writes.

Definition of done:

- Platform admin can manage global settings in admin pages.
- Sensitive platform admin reads and writes produce audit events.
- Tests prove platform admin access does not bypass consent-sensitive product behavior unless an explicit support/audit workflow is used.

### 6.2 Organization Admin

Responsibilities:

- Manage organization profile, teams, seasons, coaches, evaluators, guardians, and players.
- Manage organization role assignments.
- Review consent status and missing consent issues.
- Manage organization benchmark overrides and routine library availability.
- Review organization usage and safety flag dashboards.

Restrictions:

- Cannot access other organizations.
- Cannot edit platform-global benchmark sources unless granted platform admin rights.

Definition of done:

- Org admin can complete setup for an organization, season, team, roster, and staff.
- Org admin cannot access another organization's data.
- Org admin changes are audit logged.

### 6.3 League Admin

Responsibilities:

- View organization-level reporting where organizations belong to the same league configuration.
- Review compliance and safety summary dashboards.
- Identify adoption, completion, and safety-flag trends.

Restrictions:

- No direct editing of organization data unless separately assigned an org role.
- No player-level sensitive data unless explicitly granted by the product policy.

Definition of done:

- League admin can view aggregate dashboards scoped to permitted organizations.
- Tests prove league admin cannot mutate organization data by default.

### 6.4 Team Coach

Responsibilities:

- Manage assigned team roster workflows.
- Review readiness, workload, pain flags, routine compliance, and evaluation due lists.
- Log sessions and workload.
- Assign routines.
- Review player-development cards and reports.

Core question:

- Who should I modify today?

Restrictions:

- Cannot manage organization permissions.
- Cannot view unrelated teams.
- Cannot override guardian consent.

Definition of done:

- Coach dashboard displays availability, modification flags, pain flags, rest status, routine compliance, and overdue evaluations.
- Coach can complete daily workload and readiness review workflows for assigned teams.
- Coach cannot access unassigned teams or players.

### 6.5 Assistant Coach

Responsibilities:

- Enter and review assigned team data.
- Support readiness, workload, and routine tracking.

Restrictions:

- Cannot manage permissions, consent, benchmarks, or sensitive organization settings.
- Cannot access unrelated teams.

Definition of done:

- Assistant coach can perform limited entry workflows.
- Tests prove assistant coach cannot manage permissions, consent, or organization settings.

### 6.6 Guardian

Responsibilities:

- Provide required consent.
- View linked player summaries, alerts, home routines, and progress reports.
- Complete or support home readiness and routine workflows where enabled.

Restrictions:

- Cannot access unlinked players.
- Cannot edit coach/evaluator measurements unless a specific parent-entered workflow allows it.
- Cannot self-assign coach or evaluator roles.

Definition of done:

- Guardian can consent and view linked player dashboards.
- Guardian sees parent-readable language, not internal training jargon.
- Guardian cannot view unrelated players.

### 6.7 Player

Responsibilities:

- View assigned routines, goals, personal trends, upcoming evaluation date, and coachable feedback.
- Complete player-facing check-ins where consent and age policy allow.

Restrictions:

- Cannot self-edit consent.
- Cannot see public rankings.
- Cannot see prohibited sensitive comparisons.

Definition of done:

- Player dashboard shows personal goals, assigned routines, personal trends, and positive developmental feedback.
- Tests prove player cannot edit consent or access other players.

### 6.8 Evaluator

Responsibilities:

- Capture baselines, mobility/control screens, monthly evaluations, and measurement notes.
- Suggest benchmark configuration updates when appropriate.

Restrictions:

- Cannot manage organization permissions.
- Cannot access players outside assigned evaluation scope.

Definition of done:

- Evaluator can capture standardized evaluations and measurements.
- Evaluator entries store protocol version, context, and entered-by metadata.

## 7. Core Product Behavior

### 7.1 Primary Workflow

The MVP workflow is:

1. Create organization.
2. Create season.
3. Create team.
4. Invite or create coach, evaluator, guardian, and player accounts.
5. Link player to guardian.
6. Capture required consent.
7. Assign player to team and season.
8. Capture baseline evaluation.
9. Enable daily readiness checks.
10. Log sessions and workload.
11. Assign routines.
12. Capture routine completion.
13. Run monthly evaluation.
14. Generate report.
15. Escalate and resolve safety flags.

Definition of done:

- The full workflow is executable in an end-to-end test with seeded basketball, baseball, and softball demo data.

### 7.2 Player Dashboard

Must show:

- Current goals.
- Today's readiness status.
- Assigned routines.
- Last 30 days of personal trend lines.
- Upcoming evaluation date.
- Recent personal bests.
- One coachable developmental message.
- Benchmark confidence tags when shown.

Must not show:

- Public rank.
- Diagnosis language.
- Talent score.
- Return-to-play recommendation.

Definition of done:

- Snapshot and accessibility tests cover dashboard states for normal, missing baseline, active alert, and weak-benchmark cases.

### 7.3 Guardian Dashboard

Must show:

- What to do this week.
- Recent progress.
- Routine completion.
- Readiness alerts.
- Pain flags.
- Evaluation history.
- Coach comments.

Language requirements:

- Parent-readable.
- Action-oriented.
- No medical claims.

Definition of done:

- Guardian can understand next actions without training jargon.
- Guardian cannot see unlinked player data.

### 7.4 Coach Dashboard

Must show:

- Roster readiness.
- Missed check-ins.
- Pain flags.
- Throwing or pitching rest status.
- Routine compliance.
- Monthly evaluation due list.
- Player-development cards.

The dashboard must answer:

- Who should I modify today?

Definition of done:

- Coach can identify available, modify, and hold players without opening each player profile.
- Red and yellow flags include explanation and next safe action.

### 7.5 Admin Dashboard

Must show:

- Usage.
- Completion rates.
- Safety-flag counts.
- Missing-consent issues.
- Metric adoption.
- Benchmark configuration coverage.

Definition of done:

- Org admin can identify setup gaps, consent gaps, benchmark gaps, and adoption issues.

## 8. Data Model Contracts

The implementation should use Prisma with PostgreSQL. Exact column names can follow TypeScript/Prisma naming conventions, but the domain invariants below are required.

### 8.1 Core Entities

| Entity | Required fields |
|---|---|
| Organization | id, name, timezone, featureFlags, createdAt, updatedAt |
| Season | id, organizationId, name, startDate, endDate, createdAt, updatedAt |
| Team | id, organizationId, seasonId, sport, sexCategory, level, name, activeStatus |
| UserProfile | id, externalIdentityId, email, displayName, createdAt, updatedAt |
| OrganizationMembership | id, organizationId, userId, role, status |
| TeamMembership | id, teamId, userId, role, status |
| Player | id, organizationId, preferredName, dateOfBirth, sexAtBirth, sports, positions, dominantHand, dominantFoot, activeStatus |
| GuardianPlayerLink | id, guardianUserId, playerId, relationship, status |
| ConsentRecord | id, playerId, guardianUserId, consentType, status, grantedAt, revokedAt, version |
| MetricDefinition | id, code, displayName, sportScope, domain, valueType, unit, captureDifficulty, protocolVersion, benchmarkPolicy, confidenceLevel, ageMin, ageMax, sexScope, maturityScope, requiresGuardianConsent, safetyWarning, recommendedRetestIntervalDays, visibleToPlayer, visibleToGuardian, visibleToCoach, rankingAllowed |
| Evaluation | id, organizationId, playerId, evaluatorUserId, evaluationType, date, notes |
| Measurement | id, organizationId, playerId, evaluationId, workloadEntryId, metricDefinitionId, valueNumber, valueText, valueBoolean, protocolVersion, context, enteredByUserId, enteredByRole |
| ReadinessCheck | id, organizationId, playerId, date, sleepHours, sleepQuality, sorenessScore, painAny, painBodyParts, energyScore, moodScore, notes, enteredByUserId |
| WorkloadEntry | id, organizationId, playerId, teamId, date, sport, sessionType, minutes, sessionRpe, throws, pitches, innings, participationStatus, notes, enteredByUserId |
| Routine | id, organizationId, sport, level, name, durationMin, equipment, stopRules, progressionRules, activeStatus |
| RoutineAssignment | id, organizationId, routineId, playerId, teamId, assignedByUserId, dueDates, frequency, status |
| RoutineCompletion | id, organizationId, assignmentId, playerId, date, completed, quality, painDuring, rpe, notes |
| Alert | id, organizationId, playerId, severity, ruleCode, bodyPart, sourceType, sourceId, reason, nextAction, status, escalatedToGuardianAt, escalatedToCoachAt, resolvedAt |
| Goal | id, organizationId, playerId, metricDefinitionId, targetType, targetValue, dueDate, status |
| Benchmark | id, organizationId, metricDefinitionId, ageBand, sexScope, maturityScope, levelScope, sourceTitle, sourceCitation, confidence, lowerBound, midBound, upperBound, notes |
| Recommendation | id, organizationId, triggerType, ruleCode, outputText, severity, activeStatus |
| Report | id, organizationId, playerId, teamId, reportType, generatedAt, generatedByUserId, snapshotPayload, blobUri |
| AuditEvent | id, organizationId, actorUserId, action, entityType, entityId, occurredAt, metadata |

### 8.2 Data Invariants

| Invariant | Requirement |
|---|---|
| Tenant isolation | Every tenant-owned row must include `organizationId` or be reachable through a required tenant-owned parent. |
| Consent | Readiness, pain, and sensitive youth data collection requires active consent where policy requires it. |
| Metric code uniqueness | `MetricDefinition.code` must be unique within its configured scope. |
| Benchmark safety | Benchmark comparison cannot render for `within_player_only` metrics. |
| Ranking safety | Metrics with `rankingAllowed = false` cannot appear in rank or leaderboard queries. |
| Measurement protocol | Measurements must store protocol version used at capture time. |
| Report immutability | Reports store snapshot payloads so historical reports are stable. |
| Alert explainability | Alerts must store reason and next action text. |
| Auditability | Consent, role, benchmark, alert status, report generation, and sensitive player-data changes must produce audit events. |

## 9. MetricDefinition Contract

Every metric must be metadata-driven. A metric is not just a name and a number.

Required fields:

| Field | Accepted values or expectation |
|---|---|
| code | Stable machine-readable identifier. |
| displayName | User-facing label. |
| sportScope | universal, basketball, baseball, softball, multi. |
| domain | readiness, workload, physical, skill, movement, growth, safety. |
| valueType | integer, decimal, percent, boolean, enum, rubric, text. |
| unit | Required unless value type is boolean, enum, rubric, or text. |
| captureDifficulty | home_easy, practice_easy, simple_equipment, advanced_optional. |
| protocolVersion | Version string for measurement method. |
| benchmarkPolicy | hard_coded, admin_imported, local_only, within_player_only. |
| confidenceLevel | strong, moderate, consensus, weak. |
| ageMin | Minimum intended age. |
| ageMax | Maximum intended age. |
| sexScope | all, female, male, custom as legally/product-approved. |
| maturityScope | all, maturity_context_required, local_only. |
| requiresGuardianConsent | Boolean. |
| safetyWarning | Optional warning text shown near risky metrics. |
| recommendedRetestIntervalDays | Minimum suggested retest interval. |
| visibleToPlayer | Boolean. |
| visibleToGuardian | Boolean. |
| visibleToCoach | Boolean. |
| rankingAllowed | Boolean, default false for sensitive or high-misuse metrics. |

Definition of done:

- Seed metric definitions include all MVP metrics from `deep-research-report.md`.
- Tests prove benchmark and ranking behavior is driven by metadata, not hard-coded UI exceptions.

## 10. Seed Metrics

MVP seed metrics:

| Code | Domain | Sport scope |
|---|---|---|
| sleep_hours | readiness | universal |
| soreness_score | readiness | universal |
| pain_any | safety | universal |
| pain_throwing_arm | safety | baseball, softball |
| energy_score | readiness | universal |
| session_rpe | workload | universal |
| session_minutes | workload | universal |
| height_cm | growth | universal |
| body_mass_kg | growth | universal |
| sprint_10m_s | physical | universal |
| broad_jump_cm | physical | universal |
| vertical_jump_cm | physical | universal |
| single_leg_balance_s_left | movement | universal |
| single_leg_balance_s_right | movement | universal |
| ankle_knee_to_wall_cm_left | movement | universal |
| ankle_knee_to_wall_cm_right | movement | universal |
| basketball_ft_20_made | skill | basketball |
| basketball_spot_shooting_left_corner_made | skill | basketball |
| basketball_ballhandling_course_time_s | skill | basketball |
| baseball_pitch_count | workload | baseball |
| baseball_pitch_velocity_mph | skill | baseball |
| baseball_strike_pct | skill | baseball |
| baseball_throw_velocity_mph | skill | baseball |
| softball_pitch_velocity_mph | skill | softball |
| softball_innings_pitched | workload | softball |
| softball_consecutive_pitch_days | workload | softball |
| softball_strike_pct | skill | softball |

Definition of done:

- Seed data creates these metrics with safety-appropriate `benchmarkPolicy`, `confidenceLevel`, `rankingAllowed`, and visibility values.

## 11. Seed Routines

MVP seed routines:

| Code | Sport | Expected use |
|---|---|---|
| basketball_beginner_ball_control_12m | basketball | Beginner home ball-control routine. |
| basketball_intermediate_landing_and_footwork_18m | basketball | Intermediate landing, control, and footwork routine. |
| baseball_beginner_armcare_12m | baseball | Beginner arm-care routine. |
| baseball_intermediate_accel_and_rotation_18m | baseball | Intermediate acceleration and rotation routine. |
| softball_beginner_armcare_and_hip_mobility_12m | softball | Beginner arm-care and hip mobility routine. |
| softball_intermediate_pitcher_recovery_15m | softball | Intermediate pitcher recovery routine. |

Definition of done:

- Routines include level, duration, equipment, stop rules, progression rules, and completion criteria.
- Pain-related stop rules are visible before routine completion.

## 12. Alert Rules

The MVP alert engine is deterministic and rules-based.

### 12.1 Severity Levels

| Severity | Meaning |
|---|---|
| Red | Immediate modification, hold, or review required. |
| Yellow | Elevated concern; coach or guardian should monitor and adjust. |
| Blue | Informational task, missing data, due date, or low-confidence context. |

### 12.2 Red Alerts

| Rule | Trigger | Required next action |
|---|---|---|
| pain_activity | Pain reported during throwing, pitching, jumping, or sprinting. | Reduce load and notify coach/guardian. |
| pain_consecutive | Pain reported on consecutive days. | Reduce load and recommend qualified professional review if symptoms persist. |
| baseball_rest_conflict | Baseball pitcher is in required rest window but marked available. | Mark unavailable or modify activity. |
| softball_exposure_pain | Softball pitcher has repeated consecutive-day exposure plus pain or marked fatigue. | Reduce pitching exposure and notify guardian/coach. |
| unable_to_participate | Athlete checked as unable to participate. | Hold or modify session. |

### 12.3 Yellow Alerts

| Rule | Trigger | Required next action |
|---|---|---|
| readiness_drop | Sharp negative readiness change relative to own 7-day baseline. | Check in and consider modified workload. |
| growth_plus_symptom | Rapid recent height increase plus pain or performance drop. | Add context and avoid overinterpreting performance dip. |
| missed_warmups | Warm-up missed for several sessions. | Reinforce warm-up compliance. |
| workload_spike | Throwing or pitching volume meaningfully above recent normal. | Review workload plan. |
| routine_noncompliance | Routine non-compliance for 2 or more weeks. | Reassign or simplify routine. |

### 12.4 Blue Flags

| Rule | Trigger | Required next action |
|---|---|---|
| monthly_eval_due | Monthly evaluation due. | Schedule or complete evaluation. |
| goal_reset_due | Goal reset due. | Review and update goal. |
| baseline_missing | Player has no baseline. | Capture baseline. |
| low_confidence_benchmark | Benchmark confidence is low or local-only. | Display context label. |

Definition of done:

- Each alert includes severity, rule code, source, reason, next action, and status.
- Rule tests cover all red, yellow, and blue rules.
- UI never presents alert output as diagnosis.

## 13. Baseball Rest Contract

Baseball pitcher rest rules are hard-coded as safety rules because the brief identifies them as strong enough for product logic.

| Age | Daily max | Rest thresholds |
|---|---:|---|
| 9 to 10 | 75 | 1-20 same day, 21-35 1 day, 36-50 2 days, 51-65 3 days, 66+ 4 days |
| 11 to 12 | 85 | 1-20 same day, 21-35 1 day, 36-50 2 days, 51-65 3 days, 66+ 4 days |
| 13 to 14 | 95 | 1-20 same day, 21-35 1 day, 36-50 2 days, 51-65 3 days, 66+ 4 days |
| 15 to 16 | 95 | 1-30 same day, 31-45 1 day, 46-60 2 days, 61-75 3 days, 76+ 4 days |

Definition of done:

- Age is calculated from date of birth and outing date.
- Regression tests cover threshold boundaries for every age band.
- Coach dashboard shows rest status and red alert conflicts.

## 14. API Contracts

The implementation may use Next.js route handlers, but the public behavior must follow these contracts.

### 14.1 Standard Error Shape

```json
{
  "code": "VALIDATION_FAILED",
  "message": "One or more fields are invalid.",
  "fieldErrors": {
    "fieldName": ["Readable error message."]
  },
  "requestId": "req_..."
}
```

### 14.2 Required MVP Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | /api/orgs | Create organization. |
| POST | /api/teams | Create team. |
| POST | /api/players | Create player. |
| POST | /api/guardians | Create or link guardian. |
| POST | /api/evaluations | Create evaluation. |
| POST | /api/measurements | Create measurement. |
| POST | /api/readiness-checks | Create readiness check. |
| POST | /api/workload-entries | Create workload entry. |
| POST | /api/routine-assignments | Assign routine. |
| POST | /api/routine-completions | Record routine completion. |
| GET | /api/players/:id/dashboard | Player dashboard payload. |
| GET | /api/teams/:id/dashboard | Team dashboard payload. |
| GET | /api/reports/:id | Retrieve report metadata or signed access path. |
| POST | /api/alerts/recompute | Recompute alerts for scoped records. |
| POST | /api/benchmarks/import | Import organization benchmark data. |

### 14.3 API Done Criteria

- Every write endpoint uses Zod validation.
- Every protected endpoint uses identity, role, organization, relationship, and consent checks.
- Every mutation that changes sensitive data writes an audit event.
- Endpoint tests cover successful writes, validation failures, forbidden access, cross-tenant access, and missing consent.

## 15. Azure Architecture

### 15.1 Logical Components

| Component | Azure service | Purpose |
|---|---|---|
| Web app and API | Azure Container Apps | Hosts the Next.js application and API routes. |
| Worker | Azure Container Apps | Processes queue messages for alerts, reports, and notifications. |
| Scheduled jobs | Azure Container Apps jobs | Runs scheduled recomputation and maintenance tasks. |
| Container registry | Azure Container Registry | Stores built application images. |
| Database | Azure Database for PostgreSQL Flexible Server | Stores relational product data. |
| Object storage | Azure Blob Storage | Stores generated reports and future optional uploads. |
| Queue | Azure Service Bus | Durable async job queue with DLQ support. |
| Identity | Microsoft Entra External ID | Customer and staff sign-in. |
| Secrets | Azure Key Vault | Secrets, signing material, and protected configuration. |
| Config | Azure App Configuration | Feature flags and non-secret runtime settings. |
| Edge | Azure Front Door plus WAF | TLS, edge routing, WAF, managed rules, custom rate limits. |
| Observability | Azure Monitor, Application Insights, Log Analytics | Logs, traces, metrics, alerts, dashboards. |

### 15.2 Network And Security Defaults

Production MVP defaults:

- Public ingress only through Azure Front Door.
- WAF policy attached to Front Door.
- Container Apps ingress restricted where practical to Front Door traffic.
- Managed identity used for app access to Key Vault, Service Bus, Blob Storage, and App Configuration where supported.
- PostgreSQL access restricted to application runtime and approved deployment/migration process.
- Storage containers private by default.
- Report access mediated through authenticated app endpoints or short-lived signed access paths.
- Secrets are not stored in GitHub repository, app code, or container images.

Definition of done:

- Bicep creates all required resources with least-privilege identities.
- Production configuration does not require long-lived Azure credentials in GitHub secrets except federated identity setup metadata.

## 16. Environment Strategy

| Environment | Purpose | Data policy |
|---|---|---|
| dev | Developer validation and early integration. | Synthetic data only. |
| test | Automated integration and E2E test runs. | Synthetic data only. |
| staging | Production-like release validation. | Synthetic or approved masked data only. |
| prod | Live customer use. | Real data with consent, audit, monitoring, and backup controls. |

Definition of done:

- All environments are reproducible from Bicep.
- Production deployment requires manual approval.
- Non-production seeds include demo orgs for basketball, baseball, and softball.

## 17. CI/CD Plan

GitHub Actions will deploy to Azure using OpenID Connect federation.

### 17.1 Pull Request Pipeline

Required checks:

- Install dependencies.
- Typecheck.
- Lint.
- Unit tests.
- Integration tests.
- Prisma schema validation.
- Migration validation against empty database.
- Migration validation against seeded prior-state database.
- Container image build.
- Dependency vulnerability scan.

Definition of done:

- Pull requests cannot merge unless required checks pass.

### 17.2 Main Branch Pipeline

Required steps:

1. Run all PR checks.
2. Build immutable container image.
3. Push image to Azure Container Registry.
4. Deploy Bicep to test or staging.
5. Run database migration gate.
6. Deploy Container Apps revision.
7. Run smoke tests.
8. Publish deployment summary.

Definition of done:

- Main branch can deploy to staging without manual portal work.

### 17.3 Production Release Pipeline

Required steps:

1. Confirm staging smoke tests are green.
2. Review Bicep what-if output.
3. Review migration plan.
4. Require manual approval.
5. Promote image by digest.
6. Apply production infrastructure changes.
7. Apply production-safe migrations.
8. Deploy new Container Apps revision.
9. Run production smoke tests.
10. Monitor post-deploy metrics.

Definition of done:

- Production releases are reproducible, approved, auditable, and rollback-capable.

## 18. Rollback And Migration Strategy

### 18.1 App Rollback

Use Azure Container Apps revisions for application rollback.

Definition of done:

- Prior production image digest is retained.
- Runbook documents how to shift traffic back to prior revision.

### 18.2 Database Migrations

Use expand/contract patterns for risky changes:

1. Add backward-compatible schema.
2. Deploy app that writes both old and new shapes when required.
3. Backfill data.
4. Switch reads.
5. Remove old schema only after verification.

Definition of done:

- No destructive production migration runs without explicit migration notes, backup checkpoint, and rollback/restore plan.

## 19. Privacy, Consent, And Safety

### 19.1 Wellness MVP Policy

The platform is athletic development and wellness support. It must not present itself as medical software.

Required language rules:

- Use "flag", "review", "modify", "reduce load", and "consult a qualified professional if symptoms persist".
- Do not use diagnosis language.
- Do not claim to predict injury.
- Do not make return-to-play decisions.

Definition of done:

- UI copy review confirms no prohibited medical claims in MVP flows.

### 19.2 Child Privacy Gate

The product is for ages 8 to 15. Because users under 13 are in scope, production readiness requires a legal review of child privacy obligations and verifiable parental consent flow.

Required controls:

- Parent/guardian consent before collecting required sensitive child data.
- Direct notice and privacy policy approval before production use.
- Ability to record consent version, granted time, revoked time, and guardian.
- Ability to block data collection or display when required consent is missing.
- Product analytics separated from athlete data.
- No third-party advertising or behavioral tracking for youth users in MVP.

Definition of done:

- Legal review gate is completed before production collection of real youth data.
- Tests prove missing consent blocks protected workflows.

## 20. Observability And Operations

### 20.1 Telemetry

Capture:

- Request duration and failures.
- Auth success/failure counts.
- API validation failures.
- Database dependency failures.
- Service Bus enqueue and processing failures.
- Dead-letter queue counts.
- Report generation duration and failures.
- Alert recomputation duration and failures.
- Container restart counts.
- Health check status.

Definition of done:

- Application Insights dashboard shows critical app, API, queue, database, and worker health.

### 20.2 Alerts

Create Azure Monitor alerts for:

- High HTTP error rate.
- Elevated p95 latency.
- Failed deployment smoke tests.
- Container restart loop.
- Service Bus DLQ growth.
- Queue backlog age.
- Failed report generation.
- Failed alert recomputation.
- PostgreSQL CPU, storage, connection, or availability pressure.
- Key Vault access failures.
- Authentication failure spike.

Definition of done:

- Alerts route to the configured operations contact channel before production launch.

### 20.3 Runbooks

Required runbooks:

- Failed deployment rollback.
- Database restore rehearsal.
- Queue backlog triage.
- DLQ inspection and replay.
- Key Vault secret rotation.
- Consent incident response.
- Suspected cross-tenant data exposure.
- Report generation failure.
- Alert rule false positive review.

Definition of done:

- Runbooks are linked from the operations documentation and validated in staging.

## 21. Backup And Recovery

MVP uses a single US Azure region. The accepted tradeoff is lower operational complexity with weaker regional disaster recovery.

Required controls:

- PostgreSQL automated backups enabled.
- Point-in-time restore process documented.
- Restore drill performed before production launch.
- Report blobs protected from accidental public access.
- Critical storage containers protected by soft delete or retention where appropriate.

Definition of done:

- A staging restore drill proves the team can restore database state and verify application behavior.

## 22. Work Breakdown

### Phase 0: Documentation And Delivery Contract

Work:

- Create this build and deployment plan.
- Update README to identify source documents.
- Open explicit follow-up decisions as ADRs when needed.

Done:

- Plan is committed.
- README links to the plan and research report.

### Phase 1: Application Foundation

Work:

- Scaffold Next.js, TypeScript, Tailwind/component library, Prisma, Zod, and test framework.
- Add app shell, routes, layout, auth integration point, and health endpoint.
- Add local development instructions.

Done:

- `npm run typecheck`, `npm run lint`, and `npm test` pass.
- Health endpoint returns success locally.
- CI validates the scaffold.

### Phase 2: Identity, Tenancy, And Authorization

Work:

- Integrate Entra External ID.
- Implement user profile mapping from external identity.
- Implement memberships and roles.
- Implement organization/team/player/guardian/evaluator scoping.
- Implement consent gates.

Done:

- Tests cover every role and cross-tenant denial.
- Missing consent blocks protected youth data collection/display.
- Role and consent changes produce audit events.

### Phase 3: Core Data And Seed Content

Work:

- Implement Prisma schema and migrations.
- Seed organizations, sports, metrics, routines, benchmark examples, and demo users.
- Add metric metadata enforcement.

Done:

- Migrations apply to empty and seeded databases.
- Seed data covers basketball, baseball, and softball.
- Metric metadata drives visibility, benchmarks, and ranking restrictions.

### Phase 4: MVP Workflows

Work:

- Build organization, team, season, roster, guardian link, baseline, readiness, workload, routine, completion, alert, and report workflows.
- Add dashboards for player, guardian, coach, and admin.

Done:

- End-to-end test covers baseline to readiness to routine to report.
- Dashboards satisfy required behavior contracts.
- Unsafe comparison and diagnosis language are absent.

### Phase 5: Azure Infrastructure

Work:

- Create Bicep modules for Azure resources.
- Configure managed identities and least-privilege access.
- Configure App Configuration, Key Vault, Container Apps, PostgreSQL, Blob Storage, Service Bus, Front Door/WAF, and Monitor.

Done:

- `dev`, `test`, `staging`, and `prod` infrastructure can be deployed from Bicep.
- App can connect to required Azure services using managed identity where supported.

### Phase 6: CI/CD And Release Gates

Work:

- Add GitHub Actions for PR, staging, and production workflows.
- Configure OIDC federation with Azure.
- Add container build, image push, Bicep deployment, migration gate, and smoke tests.

Done:

- PR pipeline blocks unsafe changes.
- Staging deploy runs automatically from main.
- Production deploy requires approval and passes smoke tests.

### Phase 7: Operations And Production Readiness

Work:

- Configure telemetry, dashboards, alerts, backups, restore drill, runbooks, and incident response.
- Complete legal/privacy review for youth data collection.

Done:

- Production readiness checklist is signed off.
- Restore drill succeeds.
- Legal/privacy gate is complete.
- Monitoring and alert routing are verified.

## 23. Test Coverage Matrix

| Layer | Required tests |
|---|---|
| Unit | Alert rules, benchmark resolver, baseball rest windows, softball workload flags, metric visibility, ranking restrictions, validation schemas. |
| Authorization | Every role across organization, team, player, guardian, evaluator, consent, and cross-tenant denial. |
| Integration | Baseline evaluation, readiness check, workload entry, routine assignment/completion, alert generation, report snapshot generation. |
| End-to-end | Org setup, roster setup, guardian check-in, coach workload review, pain-triggered alert, monthly report, baseball rest conflict. |
| Migration | Empty database migration, prior-state migration, backward-compatible migration behavior. |
| Deployment | Login, health endpoint, database connection, Service Bus enqueue/dequeue, Blob report write/read, dashboard rendering. |
| Security | Cross-tenant denial, missing-consent denial, private blob denial, unsafe leaderboard prevention. |
| Accessibility | Keyboard navigation, labels, focus states, contrast, and form errors for key MVP screens. |

## 24. Acceptance Scenarios

These scenarios define MVP acceptance.

| Scenario | Expected result |
|---|---|
| Coach reviews team before practice | Coach can identify available, modify, and hold players without opening every profile. |
| Guardian checks weekly plan | Guardian sees what to do this week, current alerts, and assigned routine. |
| Player views progress | Player sees personal routines, goals, trends, and encouragement without rankings. |
| Evaluator captures monthly evaluation | Measurements store protocol version, context, and evaluator metadata. |
| Org admin configures a season | Teams, roster, staff, guardians, consent status, and benchmark settings are manageable. |
| Baseball pitcher lacks required rest | Coach dashboard shows red alert and unavailable/modify state. |
| Player reports throwing-arm pain | Red alert is generated and throwing routines are suppressed until review. |
| Metric is within-player only | External benchmark comparison is not rendered. |
| Metric forbids ranking | Metric cannot appear in leaderboard or rank card. |
| Guardian lacks consent | Sensitive youth readiness or pain workflows are blocked. |
| Cross-tenant access attempted | Request is denied and audit/security telemetry is emitted. |

## 25. Definition Of Done Summary

The MVP is done only when all conditions are true:

| Area | Done condition |
|---|---|
| Product | MVP workflows are usable end to end for basketball, baseball, and softball. |
| Domain | Roles, terms, data contracts, and expected behavior match this plan. |
| Safety | Pain, workload, rest, benchmark, and ranking rules are implemented and tested. |
| Authorization | Every protected path enforces role, tenant, relationship, and consent boundaries. |
| Data | Migrations, seed data, audit events, and report snapshots are implemented. |
| UI | Dashboards support player, guardian, coach, and admin workflows without prohibited language or rankings. |
| Testing | Required unit, integration, E2E, authorization, migration, security, accessibility, and smoke tests pass. |
| Azure | Infrastructure is reproducible from Bicep and deployed through GitHub Actions. |
| Operations | Monitoring, alerts, backups, restore drill, runbooks, and rollback process are verified. |
| Privacy | Legal/privacy review approves production data collection and consent flow. |

## 26. Open Risks

| Risk | Mitigation |
|---|---|
| Child privacy obligations are underestimated. | Legal review is a production gate before collecting real youth data. |
| Single-region MVP has regional outage risk. | Document accepted risk, verify backups, and defer cross-region DR to post-MVP. |
| Coaches misuse benchmarks or velocity metrics. | Use metadata-driven visibility, confidence labels, and ranking restrictions. |
| Alert false positives reduce trust. | Keep rules explainable, deterministic, and reviewable. |
| Data model overbuild slows delivery. | Build only MVP entities needed for core workflows and reports. |
| Medical interpretation risk. | Use wellness language and avoid diagnosis, prediction, and return-to-play claims. |

## 27. Post-MVP Roadmap

Phase 2:

- Device-assisted entry.
- Local benchmark import.
- Bulk team testing workflows.
- Better report customization.
- Optional video attachments.

Phase 3:

- Native mobile capture or stronger PWA offline support.
- Organization benchmarking with confidence guards.
- Advanced evaluator workflows.
- External integrations.
- More advanced but transparent recommendation rules.
- Cross-region disaster recovery if product adoption justifies cost.

