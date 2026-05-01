export const workflowCards = [
  {
    href: "/org/setup",
    title: "Organization setup",
    eyebrow: "Admin",
    summary: "Create the tenant, season, teams, staff roles, and consent defaults."
  },
  {
    href: "/team/setup",
    title: "Team setup",
    eyebrow: "Coach",
    summary: "Configure sport, season, roster, coach access, and evaluation rhythm."
  },
  {
    href: "/roster",
    title: "Roster",
    eyebrow: "Operations",
    summary: "Track players, guardians, consent state, active teams, and missing baselines."
  },
  {
    href: "/player/profile",
    title: "Player profile",
    eyebrow: "Development",
    summary: "Show personal trends, alerts, routines, goals, and report history without rankings."
  },
  {
    href: "/dashboards/player",
    title: "Player dashboard",
    eyebrow: "Read model",
    summary: "Load player dashboard payloads for readiness, alerts, routines, and next action."
  },
  {
    href: "/dashboards/team",
    title: "Team dashboard",
    eyebrow: "Read model",
    summary: "Load coach-facing roster status, modify counts, and open alerts."
  },
  {
    href: "/evaluations/baseline",
    title: "Baseline evaluation",
    eyebrow: "Evaluator",
    summary: "Capture launch metrics with protocol version, context, and benchmark confidence."
  },
  {
    href: "/readiness",
    title: "Readiness check",
    eyebrow: "Daily",
    summary: "Capture sleep, soreness, pain, energy, mood, and immediate safety flags."
  },
  {
    href: "/workload",
    title: "Workload entry",
    eyebrow: "Session",
    summary: "Record minutes, RPE, participation, throws, pitches, innings, and workload alerts."
  },
  {
    href: "/routines",
    title: "Routines",
    eyebrow: "Home plan",
    summary: "Assign safe routines with stop rules, completion quality, and pain suppression."
  },
  {
    href: "/reports",
    title: "Reports",
    eyebrow: "Review",
    summary: "Generate immutable monthly player summaries and parent/coach views."
  },
  {
    href: "/reports/view",
    title: "Report viewer",
    eyebrow: "Snapshot",
    summary: "Load immutable report payloads for review and browser printing."
  },
  {
    href: "/admin",
    title: "Admin controls",
    eyebrow: "Governance",
    summary: "Manage metrics, benchmarks, alerts, consents, audit events, and feature flags."
  }
] as const;

export const doneChecklist = [
  "Role, tenant, relationship, and consent checks are enforced before protected data access.",
  "Pain and workload alerts explain why they fired and what safe action should happen next.",
  "Benchmark and ranking behavior is driven by MetricDefinition metadata.",
  "Reports store immutable snapshots rather than recalculating historical summaries.",
  "No MVP screen presents diagnosis, return-to-play decisions, public rankings, or talent scores."
] as const;
