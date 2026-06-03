"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MePayload = {
  teams: Array<{
    id: string;
    name: string;
    role: string;
    brand: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      logoUrl: string | null;
    };
  }>;
};

type TeamDashboardPayload = {
  dashboard: {
    team: {
      id: string;
      name: string;
      sport: string;
    };
    brand: {
      displayName: string;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      logoUrl: string | null;
    };
    rosterCount: number;
    modifyCount: number;
    guardianGapCount: number;
    consentGapCount: number;
    pendingInviteCount: number;
    players: Array<{
      id: string;
      preferredName: string;
      status: "available" | "modify_or_hold";
      guardianStatus: "linked" | "invited" | "missing";
      consentStatus: "active" | "missing";
      pendingInviteCount: number;
    }>;
    openAlerts: Array<{
      playerId: string;
      severity: "red" | "yellow" | "blue";
      ruleCode: string;
      reason: string;
      nextAction: string;
    }>;
  };
};

function severityClass(severity: "red" | "yellow" | "blue") {
  if (severity === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (severity === "yellow") {
    return "border-yellow-200 bg-yellow-50 text-yellow-900";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

export function TeamDashboard() {
  const [teams, setTeams] = useState<MePayload["teams"]>([]);
  const [teamId, setTeamId] = useState("");
  const [dashboard, setDashboard] = useState<TeamDashboardPayload["dashboard"] | null>(null);
  const [message, setMessage] = useState("Loading your teams...");
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const playerNameById = useMemo(() => {
    const names = new Map<string, string>();

    for (const player of dashboard?.players ?? []) {
      names.set(player.id, player.preferredName);
    }

    return names;
  }, [dashboard]);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      const response = await fetch("/api/me");
      const body = (await response.json()) as MePayload & { message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setSignedOut(true);
        setMessage(body.message ?? "Sign in as a coach or organization admin to view team dashboards.");
        return;
      }

      setTeams(body.teams);
      setTeamId(body.teams[0]?.id ?? "");
      setMessage(body.teams.length ? "" : "No teams are assigned to your account yet.");
    }

    void loadTeams();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!teamId) {
        setDashboard(null);
        return;
      }

      setLoadingDashboard(true);
      const response = await fetch(`/api/teams/${teamId}/dashboard`);
      const body = (await response.json()) as TeamDashboardPayload & { message?: string };

      if (!active) {
        return;
      }

      setLoadingDashboard(false);

      if (!response.ok) {
        setDashboard(null);
        setMessage(body.message ?? "Could not load team dashboard.");
        return;
      }

      setDashboard(body.dashboard);
      setMessage("");
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [teamId]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <section
        className="rounded-lg p-6 text-white"
        style={{
          backgroundColor: dashboard?.brand.primaryColor ?? "#7a1020",
          color: dashboard?.brand.accentColor ?? "#ffffff"
        }}
      >
        <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: dashboard?.brand.secondaryColor ?? "#f4c542" }}>
          Team Today
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">{dashboard?.brand.displayName ?? "Team Today"}</h1>
            <p className="mt-3 max-w-2xl leading-7">
              See who is available, who needs a modified plan, and what needs attention before the next session.
            </p>
          </div>
          {!signedOut ? <label className="grid min-w-64 gap-2 text-sm font-bold">
            Team
            <select
              className="rounded-md border border-white/30 bg-white px-3 py-2 font-normal text-black"
              onChange={(event) => setTeamId(event.target.value)}
              value={teamId}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.role})
                </option>
              ))}
            </select>
          </label> : null}
        </div>
      </section>

      {message ? <p className="mt-5 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}
      {signedOut ? (
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to open Team Today</h2>
          <p className="mt-2 leading-7 text-black/65">Team dashboards require coach or administrator access.</p>
          <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
            Sign in
          </Link>
        </section>
      ) : null}
      {loadingDashboard ? <p className="mt-5 rounded-md bg-white p-4 font-bold">Loading dashboard...</p> : null}

      {dashboard && !signedOut ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Roster</p>
              <p className="mt-2 text-4xl font-black text-[color:var(--accent-strong)]">{dashboard.rosterCount}</p>
              <p className="mt-2 text-sm">Active players on this team.</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Modify today</p>
              <p className="mt-2 text-4xl font-black text-[color:var(--warning)]">{dashboard.modifyCount}</p>
              <p className="mt-2 text-sm">Players with open safety or workload flags.</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Open alerts</p>
              <p className="mt-2 text-4xl font-black text-[color:var(--accent-strong)]">{dashboard.openAlerts.length}</p>
              <p className="mt-2 text-sm">Current flags needing review.</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Guardian gaps</p>
              <p className="mt-2 text-4xl font-black text-[color:var(--warning)]">{dashboard.guardianGapCount}</p>
              <p className="mt-2 text-sm">Missing linked guardians.</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Consent gaps</p>
              <p className="mt-2 text-4xl font-black text-[color:var(--warning)]">{dashboard.consentGapCount}</p>
              <p className="mt-2 text-sm">Missing readiness, workload, or report consent.</p>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Roster status</h2>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/roster">
                    Add players
                  </Link>
                  <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/routines">
                    Assign routines
                  </Link>
                  <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/reports">
                    Reports
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {dashboard.players.length ? (
                  dashboard.players.map((player) => (
                    <article className="rounded-md border border-black/10 p-4" key={player.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black">{player.preferredName}</h3>
                          <p className="mt-1 text-sm text-black/60">
                            Guardian {player.guardianStatus === "linked" ? "linked" : player.guardianStatus === "invited" ? "invited" : "missing"} ·
                            Consent {player.consentStatus === "active" ? "active" : "needed"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            player.status === "modify_or_hold" ? "bg-yellow-100 text-yellow-900" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {player.status === "modify_or_hold" ? "Modify" : "Available"}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          className="rounded-md bg-[color:var(--accent-strong)] px-3 py-2 text-sm font-bold text-white"
                          href={`/dashboards/player?playerId=${encodeURIComponent(player.id)}`}
                        >
                          View player
                        </Link>
                        <Link
                          className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold"
                          href={`/reports?playerId=${encodeURIComponent(player.id)}`}
                        >
                          Reports
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No active players on this team yet. Add roster rows to start.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Open alerts</h2>
                <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/routines">
                  Assign routines
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {dashboard.openAlerts.length ? (
                  dashboard.openAlerts.map((alert) => (
                    <article className={`rounded-md border p-3 ${severityClass(alert.severity)}`} key={`${alert.playerId}-${alert.ruleCode}-${alert.reason}`}>
                      <p className="text-xs font-black uppercase tracking-[0.14em]">
                        {alert.severity} · {playerNameById.get(alert.playerId) ?? "Player needs review"}
                      </p>
                      <p className="mt-2 font-bold">{alert.reason}</p>
                      <p className="mt-1 text-sm">{alert.nextAction}</p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-green-50 p-4 font-bold text-green-800">No open alerts for this team.</p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
