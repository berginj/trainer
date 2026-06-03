# UX Screen Review

Core screens are reviewed for owner persona, purpose, primary CTA, state handling, mobile expectation, and polish priority.

| Screen | Owner | Purpose | Primary CTA | Empty / Loading / Error State | Mobile Note | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | All signed-in personas | Role-aware product home with persona switcher and next actions | Open the selected persona home | Signed out shows sign-in entry; loading uses shell skeleton; error links to sign in | Summary cards stack and switcher stays near top | P0 |
| `/workflows` | Internal/admin/dev | MVP cockpit and API utility index | Open internal workflow | Empty checklist not expected; internal banner clarifies scope | Cards use single-column on small screens | P1 |
| `/signin` | All | OAuth entry for invited users | Continue with configured provider | Provider missing banner when env is not configured | Centered narrow form, no clipping | P0 |
| `/guardian/home` | Parent/guardian | Parent home for linked children | Complete, skip, pain, consent, open child view | No linked players, no assignments, no reports, missing consent, save failure | Child cards stack; buttons wrap cleanly | P0 |
| `/athlete/home` | Adult athlete / child co-view | Safe athlete next-action view | Complete today's routine or open latest report | No linked athlete, no routine, no reports, access failure | First viewport shows routine and safety state | P0 |
| `/dashboards/team` | Coach/admin | Team Today dashboard | View player, add roster, assign routine, generate report | No teams, no roster, no alerts, load failure | Metrics first, roster cards stack | P0 |
| `/roster` | Coach/admin | Bulk player add and guardian invite creation | Add players to roster | No organization/team, row validation, invite failure, success next steps | Form fields wrap and remain readable | P0 |
| `/admin` | Admin | Organization control center | Fix readiness gaps | No orgs, no gaps, no alerts, no audit events, load failure | Checklist and counts before detailed panels | P0 |
| `/reports` | Parent/coach/admin/athlete | Role-aware report center | Generate report for staff, view report for parent/athlete | No reports, no player, generation failure, load failure | List cards with view action visible | P1 |
| `/reports/view` | Parent/coach/admin/athlete | Printable immutable report | Print | Missing report ID, access failure, load failure | Print controls hidden for print; content stacks | P1 |
| `/dashboards/player` | Parent/coach/admin/athlete | Shared player detail | Open report, manage goals/routines as allowed | No player, no routines, no goals, no alerts, load failure | Cards stack and raw IDs hidden | P1 |
| `/player/profile` | Coach/admin | Personal development goal management | Create goal | No players, no goals, create/update failure | Selectors stack; create form stays compact | P1 |

## Polish Notes

Admin-neutral global shell:
- Use neutral product colors for `/`, `/workflows`, `/admin`, and sign-in.
- Team colors appear in guardian, athlete, coach team, and player contexts.

Raw ID handling:
- Core persona screens do not require copying organization, team, player, or report IDs.
- Raw IDs are allowed in `/workflows` and API-form utilities.
- Admin audit IDs are hidden until expanded.

Role-aware report behavior:
- Parent and athlete users see linked-player reports only.
- Coaches and admins can generate reports and browse organization reports.
- Report copy remains personal-development focused.

Safety language:
- Use "modify", "hold", "pause", "check in", and "tell the coach/guardian".
- Do not use diagnosis, clearance, eligibility, talent label, public rank, or scouting language.

Verification checklist:
- Sign-in entry renders when `/api/me` is forbidden.
- Multi-role users can change persona on `/`.
- Guardian can open child co-view from `/guardian/home`.
- Adult athlete with a player invitation can open `/athlete/home`.
- Coach can move from Team Today to roster, player detail, routines, and reports.
- Admin gap panels each include a remediation link.
- Reports and player detail hide raw IDs in normal use.
