"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MePayload = {
  access?: {
    roles: string[];
  };
  linkedPlayers: Array<{
    id: string;
    preferredName: string;
    teams: Array<{ id: string; name: string }>;
  }>;
};

type PlayerDashboardPayload = {
  dashboard: {
    player: {
      id: string;
      preferredName: string;
      activeStatus: string;
    };
    teams: Array<{
      id: string;
      name: string;
      brand: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        logoUrl: string | null;
      };
    }>;
    status: "available" | "modify_or_hold";
    latestReadiness: {
      date: string;
      energyScore: number | null;
      sorenessScore: number | null;
      painAny: boolean;
    } | null;
    openAlerts: Array<{
      severity: "red" | "yellow" | "blue";
      ruleCode: string;
      reason: string;
      nextAction: string;
    }>;
    assignedRoutines: Array<{
      id: string;
      frequency: string;
      routine: {
        name: string;
        sport: string;
        durationMin: number;
      };
    }>;
    goals: Array<{
      id: string;
      targetType: string;
      targetValue: string | null;
      dueDate: string | null;
      status: string;
      metricDefinition: {
        displayName: string;
        unit: string | null;
      } | null;
    }>;
    upcomingEvaluationDate: string | null;
    message: string;
  };
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not scheduled";
}

export function PlayerDashboard() {
  const [linkedPlayers, setLinkedPlayers] = useState<MePayload["linkedPlayers"]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [dashboard, setDashboard] = useState<PlayerDashboardPayload["dashboard"] | null>(null);
  const [message, setMessage] = useState("Loading player context...");
  const [loading, setLoading] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const params = new URLSearchParams(window.location.search);
      const requestedPlayerId = params.get("playerId") ?? "";
      const response = await fetch("/api/me");
      const body = (await response.json()) as MePayload & { message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setSignedOut(true);
        setMessage(body.message ?? "Sign in to view a player dashboard.");
        return;
      }

      setLinkedPlayers(body.linkedPlayers);
      setRoles(body.access?.roles ?? []);
      setPlayerId(requestedPlayerId || body.linkedPlayers[0]?.id || "");
      setMessage(requestedPlayerId || body.linkedPlayers.length ? "" : "No linked players are available.");
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!playerId) {
        setDashboard(null);
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/players/${playerId}/dashboard`);
      const body = (await response.json()) as PlayerDashboardPayload & { message?: string };

      if (!active) {
        return;
      }

      setLoading(false);

      if (!response.ok) {
        setDashboard(null);
        setMessage(body.message ?? "Could not load player dashboard.");
        return;
      }

      setDashboard(body.dashboard);
      setMessage("");
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [playerId]);

  const brand = dashboard?.teams[0]?.brand ?? {
    primaryColor: "#7a1020",
    secondaryColor: "#f4c542",
    accentColor: "#ffffff",
    logoUrl: null
  };
  const canManagePlayer = roles.some((role) =>
    ["platform_admin", "org_admin", "team_coach", "assistant_coach", "evaluator"].includes(role)
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <section className="rounded-lg p-6 text-white" style={{ backgroundColor: brand.primaryColor, color: brand.accentColor }}>
        <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: brand.secondaryColor }}>
          Player dashboard
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">{dashboard?.player.preferredName ?? "Player view"}</h1>
            <p className="mt-3 max-w-2xl leading-7">{dashboard?.message ?? "Review routines, readiness, alerts, and next action."}</p>
          </div>
          {!signedOut ? <label className="grid min-w-64 gap-2 text-sm font-bold">
            Linked player
            <select
              className="rounded-md border border-white/30 bg-white px-3 py-2 font-normal text-black"
              onChange={(event) => setPlayerId(event.target.value)}
              value={playerId}
            >
              {linkedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.preferredName}
                </option>
              ))}
              {playerId && linkedPlayers.every((player) => player.id !== playerId) ? (
                <option value={playerId}>{dashboard?.player.preferredName ?? "Selected player"}</option>
              ) : null}
            </select>
          </label> : null}
        </div>
      </section>

      {message ? <p className="mt-5 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}
      {signedOut ? (
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to view player detail</h2>
          <p className="mt-2 leading-7 text-black/65">Player detail is limited to linked athletes, parents, coaches, and administrators.</p>
          <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
            Sign in
          </Link>
        </section>
      ) : null}
      {loading ? <p className="mt-5 rounded-md bg-white p-4 font-bold">Loading player dashboard...</p> : null}

      {dashboard && !signedOut ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Status</p>
              <p className="mt-3 text-xl font-black text-[color:var(--accent-strong)]">
                {dashboard.status === "modify_or_hold" ? "Modify or hold" : "Available"}
              </p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Energy</p>
              <p className="mt-3 text-3xl font-black text-[color:var(--accent-strong)]">
                {dashboard.latestReadiness?.energyScore ?? "-"}
              </p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Soreness</p>
              <p className="mt-3 text-3xl font-black text-[color:var(--accent-strong)]">
                {dashboard.latestReadiness?.sorenessScore ?? "-"}
              </p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/55">Next eval</p>
              <p className="mt-3 text-lg font-black text-[color:var(--accent-strong)]">
                {formatDate(dashboard.upcomingEvaluationDate)}
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Assigned routines</h2>
                {canManagePlayer ? (
                  <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/routines">
                    Adjust
                  </Link>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3">
                {dashboard.assignedRoutines.length ? (
                  dashboard.assignedRoutines.map((assignment) => (
                    <article className="rounded-md border border-black/10 p-4" key={assignment.id}>
                      <h3 className="text-lg font-black">{assignment.routine.name}</h3>
                      <p className="mt-1 text-sm text-black/65">
                        {assignment.routine.durationMin} min · {assignment.frequency} · {assignment.routine.sport}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No active routines assigned.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Active goals</h2>
                {canManagePlayer ? (
                  <Link className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" href="/player/profile">
                    Manage
                  </Link>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3">
                {dashboard.goals.length ? (
                  dashboard.goals.map((goal) => (
                    <article className="rounded-md border border-black/10 p-4" key={goal.id}>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">{goal.targetType}</p>
                      <h3 className="mt-2 text-lg font-black">{goal.targetValue ?? goal.metricDefinition?.displayName ?? "Goal"}</h3>
                      <p className="mt-1 text-sm text-black/65">
                        {goal.dueDate ? `Due ${formatDate(goal.dueDate)}` : "No due date"}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No active goals.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Open alerts</h2>
                <Link
                  className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold"
                  href={playerId ? `/reports?playerId=${encodeURIComponent(playerId)}` : "/reports"}
                >
                  Reports
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {dashboard.openAlerts.length ? (
                  dashboard.openAlerts.map((alert) => (
                    <article className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-900" key={`${alert.ruleCode}-${alert.reason}`}>
                      <p className="text-xs font-black uppercase tracking-[0.14em]">{alert.severity}</p>
                      <p className="mt-2 font-bold">{alert.reason}</p>
                      <p className="mt-1 text-sm">{alert.nextAction}</p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md bg-green-50 p-4 font-bold text-green-800">No open alerts.</p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
