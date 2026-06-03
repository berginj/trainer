"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Organization = {
  id: string;
  name: string;
  role: string;
};

type AdminSummary = {
  rosterCount: number;
  missingConsentCount: number;
  playersWithoutGuardiansCount: number;
  openAlertCount: number;
  alertsBySeverity: {
    red: number;
    yellow: number;
    blue: number;
  };
  metricCount: number;
  weakBenchmarkCount: number;
  missingConsentPlayers: Array<{
    id: string;
    preferredName: string;
    teams: string[];
  }>;
  playersWithoutGuardians: Array<{
    id: string;
    preferredName: string;
    teams: string[];
  }>;
  openAlerts: Array<{
    id: string;
    playerId: string;
    playerName: string;
    teams: string[];
    severity: "red" | "yellow" | "blue";
    ruleCode: string;
    reason: string;
    nextAction: string;
    createdAt: string;
  }>;
  weakBenchmarks: Array<{
    id: string;
    sourceTitle: string;
    sourceCitation: string;
    updatedAt: string;
    metric: {
      code: string;
      displayName: string;
      sportScope: string;
      domain: string;
    };
  }>;
  recentAuditEvents: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    occurredAt: string;
    actorUserId: string | null;
    actorName: string | null;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function readinessItems(summary: AdminSummary) {
  return [
    {
      label: "Roster has active players",
      ok: summary.rosterCount > 0,
      href: "/roster"
    },
    {
      label: "Every player has report, readiness, and workload consent",
      ok: summary.missingConsentCount === 0,
      href: "/roster"
    },
    {
      label: "Every player has a guardian link or invite path",
      ok: summary.playersWithoutGuardiansCount === 0,
      href: "/roster"
    },
    {
      label: "Open alerts have been reviewed",
      ok: summary.openAlertCount === 0,
      href: "/dashboards/team"
    },
    {
      label: "Benchmark coverage has no weak imports needing review",
      ok: summary.weakBenchmarkCount === 0,
      href: "/workflows"
    }
  ];
}

export function AdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [message, setMessage] = useState("Loading admin context...");
  const [loading, setLoading] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const response = await fetch("/api/me");
      const body = (await response.json()) as { organizations?: Organization[]; message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setSignedOut(true);
        setMessage(body.message ?? "Sign in as an organization admin to view admin controls.");
        return;
      }

      const manageableOrgs = (body.organizations ?? []).filter((organization) =>
        ["org_admin", "platform_admin"].includes(organization.role)
      );

      setOrganizations(manageableOrgs);
      setOrganizationId(manageableOrgs[0]?.id ?? "");
      setMessage(manageableOrgs.length ? "" : "No manageable organizations are assigned to your account.");
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      if (!organizationId) {
        setSummary(null);
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/admin/summary?organizationId=${encodeURIComponent(organizationId)}`);
      const body = (await response.json()) as { summary?: AdminSummary; message?: string };

      if (!active) {
        return;
      }

      setLoading(false);

      if (!response.ok || !body.summary) {
        setSummary(null);
        setMessage(body.message ?? "Could not load admin summary.");
        return;
      }

      setSummary(body.summary);
      setMessage("");
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [organizationId]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <section className="rounded-lg bg-[color:var(--accent-strong)] p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Admin controls</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Safety and setup overview</h1>
            <p className="mt-3 max-w-2xl leading-7">
              Track consent gaps, guardian coverage, open alerts, metric coverage, and recent audit events.
            </p>
          </div>
          {!signedOut ? <label className="grid min-w-72 gap-2 text-sm font-bold">
            Organization
            <select
              className="rounded-md border border-white/30 bg-white px-3 py-2 font-normal text-black"
              onChange={(event) => setOrganizationId(event.target.value)}
              value={organizationId}
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name} ({organization.role})
                </option>
              ))}
            </select>
          </label> : null}
        </div>
      </section>

      {message ? <p className="mt-5 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}
      {signedOut ? (
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to view admin controls</h2>
          <p className="mt-2 leading-7 text-black/65">The control center requires organization administrator access.</p>
          <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
            Sign in
          </Link>
        </section>
      ) : null}
      {loading ? <p className="mt-5 rounded-md bg-white p-4 font-bold">Loading admin summary...</p> : null}

      {summary && !signedOut ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Roster</p>
              <p className="mt-2 text-3xl font-black">{summary.rosterCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Consent gaps</p>
              <p className="mt-2 text-3xl font-black text-[color:var(--warning)]">{summary.missingConsentCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">No guardian</p>
              <p className="mt-2 text-3xl font-black text-[color:var(--warning)]">{summary.playersWithoutGuardiansCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Open alerts</p>
              <p className="mt-2 text-3xl font-black">{summary.openAlertCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Metrics</p>
              <p className="mt-2 text-3xl font-black">{summary.metricCount}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Weak benchmarks</p>
              <p className="mt-2 text-3xl font-black">{summary.weakBenchmarkCount}</p>
            </div>
          </section>

          <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Launch readiness checklist</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {readinessItems(summary).map((item) => (
                <Link
                  className={`rounded-md border p-4 font-bold ${
                    item.ok ? "border-green-200 bg-green-50 text-green-900" : "border-yellow-200 bg-yellow-50 text-yellow-950"
                  }`}
                  href={item.href}
                  key={item.label}
                >
                  <span className="block text-xs uppercase tracking-[0.14em]">{item.ok ? "Ready" : "Needs action"}</span>
                  <span className="mt-2 block">{item.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Consent gaps</h2>
                <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/roster">
                  Add guardian invites
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {summary.missingConsentPlayers.length ? (
                  summary.missingConsentPlayers.map((player) => (
                    <article className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-900" key={player.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black">{player.preferredName}</p>
                          <p className="text-sm">{player.teams.join(", ") || "No active team"}</p>
                        </div>
                        <Link className="rounded-md bg-white px-3 py-2 text-sm font-bold" href={`/dashboards/player?playerId=${encodeURIComponent(player.id)}`}>
                          Review player
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-green-50 p-4 font-bold text-green-800">No consent gaps found.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Guardian gaps</h2>
                <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/roster">
                  Create invites
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {summary.playersWithoutGuardians.length ? (
                  summary.playersWithoutGuardians.map((player) => (
                    <article className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-900" key={player.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black">{player.preferredName}</p>
                          <p className="text-sm">{player.teams.join(", ") || "No active team"}</p>
                        </div>
                        <Link className="rounded-md bg-white px-3 py-2 text-sm font-bold" href="/roster">
                          Add invite
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-green-50 p-4 font-bold text-green-800">Every active player has a guardian link.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Alert mix</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <p className="rounded-md bg-red-50 p-4 font-bold text-red-800">Red: {summary.alertsBySeverity.red}</p>
                <p className="rounded-md bg-yellow-50 p-4 font-bold text-yellow-900">Yellow: {summary.alertsBySeverity.yellow}</p>
                <p className="rounded-md bg-blue-50 p-4 font-bold text-blue-800">Blue: {summary.alertsBySeverity.blue}</p>
              </div>
              <div className="mt-4 grid gap-3">
                {summary.openAlerts.length ? (
                  summary.openAlerts.slice(0, 8).map((alert) => (
                    <article className="rounded-md border border-black/10 p-3" key={alert.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">
                            {alert.severity} · {alert.ruleCode}
                          </p>
                          <h3 className="mt-1 font-black">{alert.playerName}</h3>
                          <p className="text-sm text-black/65">{alert.teams.join(", ") || "No active team"}</p>
                        </div>
                        <Link
                          className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold"
                          href={`/dashboards/player?playerId=${encodeURIComponent(alert.playerId)}`}
                        >
                          View player
                        </Link>
                      </div>
                      <p className="mt-2 text-sm font-bold">{alert.reason}</p>
                      <p className="mt-1 text-sm text-black/65">{alert.nextAction}</p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-green-50 p-4 font-bold text-green-800">No open alerts.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Weak benchmarks</h2>
                <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/workflows">
                  Import benchmarks
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {summary.weakBenchmarks.length ? (
                  summary.weakBenchmarks.map((benchmark) => (
                    <article className="rounded-md border border-black/10 p-3" key={benchmark.id}>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">
                        {benchmark.metric.sportScope} · {benchmark.metric.domain}
                      </p>
                      <h3 className="mt-1 font-black">{benchmark.metric.displayName}</h3>
                      <p className="text-sm text-black/65">{benchmark.sourceTitle}</p>
                      <Link className="mt-3 inline-block rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/workflows">
                        Open benchmark import utility
                      </Link>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-green-50 p-4 font-bold text-green-800">No weak benchmarks found.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Recent audit events</h2>
              <div className="mt-4 grid gap-3">
                {summary.recentAuditEvents.length ? (
                  summary.recentAuditEvents.map((event) => (
                    <article className="rounded-md border border-black/10 p-3" key={event.id}>
                      <p className="font-black">{event.action}</p>
                      <p className="text-sm text-black/65">
                        {event.entityType} · {formatDate(event.occurredAt)}
                      </p>
                      {event.actorName ? <p className="text-sm text-black/65">Actor: {event.actorName}</p> : null}
                      {event.entityId ? (
                        <details className="mt-2 text-xs text-black/60">
                          <summary className="cursor-pointer font-bold">Technical details</summary>
                          <p className="mt-1 font-mono">{event.entityId}</p>
                        </details>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No audit events yet.</p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
