# Personas And Workflows

This UX wave turns the app from an MVP cockpit into a signed-in product organized around four personas: parent, athlete, coach, and administrator. Global navigation stays admin-neutral. Team branding is used only inside team, coach, parent, and athlete contexts.

## Parent / Guardian

Primary job: know what needs attention today for each linked child and safely complete home-plan tasks.

Primary routes:
- `/` role home for next actions.
- `/guardian/home` parent home.
- `/athlete/home?playerId=...&mode=child` age-safe co-view.
- `/reports` parent-safe report center.
- `/reports/view?reportId=...` printable report.

Required actions:
- Review consent, today's assignments, weekly routine summary, pain flags, and latest reports.
- Grant required consent for linked children.
- Mark routine complete, skipped, or pain.
- Open a child co-view without copying a player ID.

Emotional tone:
- Clear, calm, non-clinical, and action oriented.
- Pain language should prompt stopping, checking in, and coach notification without diagnosing or return-to-play decisions.

Data shown:
- Linked child names, teams, consent state, assignment names, weekly completion counts, open alerts in safe language, and reports for linked players.

Data hidden:
- Other athletes, raw organization/team/player IDs, internal audit data, benchmark tables, rankings, talent labels, diagnoses, and admin controls.

Empty states:
- No linked players: explain that a team invite is required.
- No assignments: say there is no home work today.
- No reports: say reports will appear after the coach/admin generates them.
- No alerts: say there are no open safety flags.

Error states:
- Signed out: send to `/signin`.
- Missing consent: keep activity buttons disabled and explain why.
- Save failure: describe the failed task and preserve the current screen.

Mobile expectations:
- Parent can identify the next task within 10 seconds.
- Child cards stack cleanly and action buttons remain thumb-sized.
- Report and athlete co-view links are visible without horizontal scrolling.

Safety and privacy constraints:
- Parent sees only linked players.
- No medical diagnosis, return-to-play clearance, public comparison, or player ranking.
- Pain completion creates a stop-and-tell-coach message.

## Athlete

Primary job: understand today's safe routine, personal goals, and recent progress in age-appropriate language.

Primary routes:
- `/athlete/home` adult self-view.
- `/athlete/home?playerId=...&mode=child` child co-view launched from parent home.
- `/reports` athlete read-only report center.
- `/dashboards/player` shared player detail with persona-sensitive actions.

Required actions:
- View today's routine and goals.
- Complete permitted self-entry workflow for active routines.
- Review alerts in safe, plain language.
- Open latest reports.

Emotional tone:
- Encouraging but restrained.
- Focus on consistency, effort, and safety.

Data shown:
- Own linked player record, routines, completion state, active goals, recent readiness summary, open alerts, and own reports.

Data hidden:
- Rankings, team comparison, scouting or talent labels, diagnoses, return-to-play decisions, admin controls, coach-only reports, raw IDs.

Empty states:
- No linked athlete: explain that an athlete invite or parent launch is needed.
- No routine today: say there is no assigned routine today.
- No goals: say goals will appear when set with the coach or guardian.

Error states:
- Signed out: send to `/signin`.
- Consent or access blocked: use safe language and direct the user to a guardian or coach.

Mobile expectations:
- The first screen shows today's routine, safety status, and next action.
- Child co-view copy is shorter and avoids coach/admin controls.

Safety and privacy constraints:
- Adult athlete access is self-linked through player invitations.
- Child athlete independent login is out of scope for this wave.
- Athlete screens never make medical or eligibility decisions.

## Coach

Primary job: answer who is available, who needs modification, who is missing guardian or consent coverage, and what action to take next.

Primary routes:
- `/` role home for coach next actions.
- `/dashboards/team` Team Today.
- `/roster` roster and guardian invites.
- `/dashboards/player` shared player detail.
- `/routines` routine assignment.
- `/reports` report generation.

Required actions:
- Review roster count, modify/hold list, open alerts, guardian gaps, and consent gaps.
- Move to player detail, routine assignment, reports, and roster add in one click.
- Add players and guardian invites without copying IDs.

Emotional tone:
- Dense, operational, and scannable.
- Alerts should be actionable without sounding clinical.

Data shown:
- Assigned teams, active roster, availability state, guardian/consent gap labels, alerts, routine/report shortcuts.

Data hidden:
- Raw IDs by default, unrelated teams, parent-only consent details beyond gap state, admin-only audit data.

Empty states:
- No teams: explain that a team assignment or admin role is needed.
- No alerts: explicitly say all active athletes are clear of open flags.
- No roster: route to `/roster`.

Error states:
- Missing access: say coach/team access is required.
- Dashboard load failure: keep team selector visible.

Mobile expectations:
- Summary metrics appear before the roster.
- Roster cards stack without clipping.
- One-click links remain visible.

Safety and privacy constraints:
- Coach sees assigned teams and player-safe development data.
- No rankings or talent labels.

## Administrator

Primary job: assess launch readiness and remediate organization-level setup gaps from one place.

Primary routes:
- `/` role home for admin next actions.
- `/admin` control center.
- `/roster` roster and invites.
- `/reports` reports.
- `/dashboards/player` player detail.
- `/workflows` internal utilities for setup/API forms.

Required actions:
- Review setup checklist, roster health, consent gaps, guardian gaps, alerts, weak benchmarks, and recent audit events.
- Follow remediation links for every gap.

Emotional tone:
- Admin-neutral, direct, and dense.

Data shown:
- Organization-level counts, gap lists, alert mix, benchmark coverage, and recent audit event summaries.

Data hidden:
- Team branding except in linked team/player contexts.
- Raw IDs unless expanded for troubleshooting.

Empty states:
- No organizations: explain that admin access is required.
- No gaps: show positive readiness state.
- No audit events: show an empty operational state.

Error states:
- Missing access: say organization admin access is required.
- Summary load failure: preserve organization selector.

Mobile expectations:
- Readiness checklist and counts stack before detailed lists.
- Gap links remain easy to tap.

Safety and privacy constraints:
- Admin views remain operational and avoid player comparison labels.

## Internal Utilities

These screens remain useful but are not the signed-in MVP product home:
- `/workflows` internal cockpit and API contract index.
- `/org/setup`, `/team/setup`, `/evaluations/baseline`, `/readiness`, `/workload`, `/calendar-sync`, `/appointments/review`, `/schedule-changes`, `/payments/venmo`, `/gamechanger`, and raw API-form helpers.

Internal utility rules:
- Mark the cockpit as internal.
- Keep raw ID entry in internal utilities only.
- Link real persona users to polished routes first.
