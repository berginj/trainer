"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertBanner, EmptyState, StatusCard } from "@/app/_components/product-shell";

type MePayload = {
  access?: {
    roles: string[];
  };
  linkedPlayers?: Array<{
    id: string;
    preferredName: string;
    relationship?: string;
  }>;
  message?: string;
};

type GuardianHomePayload = {
  players: Array<{
    id: string;
    organizationId: string;
    preferredName: string;
    relationship?: string;
    consent: { granted: boolean };
    weeklySummary: {
      completedCount: number;
      skippedCount: number;
      painCount: number;
    };
    reports: Array<{
      id: string;
      reportType: string;
      generatedAt: string;
    }>;
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
    alerts: Array<{
      severity: string;
      reason: string;
      nextAction: string;
    }>;
  }>;
  assignments: Array<{
    id: string;
    organizationId: string;
    playerId: string;
    dueDates: string[];
    frequency: string;
    routine: {
      name: string;
      durationMin: number;
      stopRules: unknown;
    };
    team: {
      name: string;
      brand: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
      };
    } | null;
    completions: Array<{
      date: string;
      completed: boolean;
      painDuring: boolean;
    }>;
  }>;
  message?: string;
};

type PlayerDashboardPayload = {
  dashboard?: {
    status: "available" | "modify_or_hold";
    latestReadiness: {
      date: string;
      energyScore: number | null;
      sorenessScore: number | null;
      painAny: boolean;
    } | null;
    goals: Array<{
      id: string;
      targetType: string;
      targetValue: string | null;
      dueDate: string | null;
      metricDefinition: {
        displayName: string;
        unit: string | null;
      } | null;
    }>;
    message: string;
  };
  message?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "No date";
}

function isDoneToday(assignment: GuardianHomePayload["assignments"][number]) {
  return assignment.completions.some(
    (completion) => completion.date.slice(0, 10) === today() && completion.completed
  );
}

export function AthleteHome() {
  const [data, setData] = useState<GuardianHomePayload | null>(null);
  const [dashboard, setDashboard] = useState<PlayerDashboardPayload["dashboard"] | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [mode, setMode] = useState<"adult" | "child">("adult");
  const [message, setMessage] = useState("Loading athlete home...");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  const selectedPlayer = useMemo(
    () => data?.players.find((player) => player.id === playerId) ?? data?.players[0] ?? null,
    [data?.players, playerId]
  );
  const assignments = useMemo(
    () => data?.assignments.filter((assignment) => assignment.playerId === selectedPlayer?.id) ?? [],
    [data?.assignments, selectedPlayer?.id]
  );
  const openAssignments = assignments.filter((assignment) => !isDoneToday(assignment));
  const brand = selectedPlayer?.teams[0]?.brand ?? {
    primaryColor: "#7a1020",
    secondaryColor: "#f4c542",
    accentColor: "#ffffff",
    logoUrl: null
  };

  const load = useCallback(async (nextPlayerId = playerId) => {
    const response = await fetch("/api/guardian/home");
    const body = (await response.json()) as GuardianHomePayload;

    if (!response.ok) {
      setSignedOut(true);
      setData(null);
      setMessage(body.message ?? "Sign in with linked athlete access to view this page.");
      return;
    }

    setSignedOut(false);
    setData(body);
    setMessage("");

    const resolvedPlayerId = nextPlayerId || body.players[0]?.id || "";

    if (resolvedPlayerId) {
      const dashboardResponse = await fetch(`/api/players/${resolvedPlayerId}/dashboard`);
      const dashboardBody = (await dashboardResponse.json()) as PlayerDashboardPayload;

      setDashboard(dashboardResponse.ok ? (dashboardBody.dashboard ?? null) : null);
    }
  }, [playerId]);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      const params = new URLSearchParams(window.location.search);
      const requestedPlayerId = params.get("playerId") ?? "";
      const requestedMode = params.get("mode") === "child" ? "child" : "adult";
      const meResponse = await fetch("/api/me");
      const meBody = (await meResponse.json()) as MePayload;

      if (!active) {
        return;
      }

      if (!meResponse.ok) {
        setSignedOut(true);
        setMessage(meBody.message ?? "Sign in with linked athlete access to view this page.");
        return;
      }

      const fallbackPlayerId = requestedPlayerId || meBody.linkedPlayers?.[0]?.id || "";

      setMode(requestedMode);
      setPlayerId(fallbackPlayerId);
      await load(fallbackPlayerId);
    }

    void loadInitial();

    return () => {
      active = false;
    };
  }, [load]);

  async function completeAssignment(input: {
    assignmentId: string;
    playerId: string;
    completed: boolean;
    painDuring: boolean;
  }) {
    const assignment = assignments.find((item) => item.id === input.assignmentId);

    if (!assignment) {
      return;
    }

    setSubmittingId(input.assignmentId);
    const response = await fetch("/api/routine-completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId: assignment.organizationId,
        assignmentId: input.assignmentId,
        playerId: input.playerId,
        date: today(),
        completed: input.completed,
        painDuring: input.painDuring,
        quality: input.completed ? "done" : "skipped",
        notes: input.painDuring ? "Reported pain during routine." : undefined
      })
    });
    const body = (await response.json()) as { message?: string };

    setSubmittingId(null);

    if (!response.ok) {
      setMessage(body.message ?? "Could not save that routine update.");
      return;
    }

    setMessage(input.painDuring ? "Saved pain flag. Pause this activity and tell your coach or guardian." : "Saved today's routine update.");
    await load(input.playerId);
  }

  return (
    <main
      className="min-h-screen px-4 py-6"
      style={
        {
          "--team-primary": brand.primaryColor,
          "--team-secondary": brand.secondaryColor,
          "--team-accent": brand.accentColor
        } as CSSProperties
      }
    >
      <section className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link className="font-bold text-[color:var(--accent-strong)]" href="/">
            Trainer
          </Link>
          {!signedOut ? <div className="flex flex-wrap gap-2 text-sm font-bold">
            <Link className="rounded-md border border-black/15 bg-white px-3 py-2" href="/guardian/home">
              Parent home
            </Link>
            <Link className="rounded-md border border-black/15 bg-white px-3 py-2" href="/reports">
              Reports
            </Link>
          </div> : null}
        </div>

        <section className="rounded-lg p-5 text-white" style={{ backgroundColor: brand.primaryColor, color: brand.accentColor }}>
          <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: brand.secondaryColor }}>
            {mode === "child" ? "Athlete co-view" : "Athlete home"}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black">{selectedPlayer?.preferredName ?? "Athlete home"}</h1>
              <p className="mt-3 max-w-2xl leading-7">
                {mode === "child"
                  ? "Review today's plan together. Stop if pain shows up, and ask an adult before repeating it."
                  : "Review today's routine, personal goals, and safe next steps."}
              </p>
            </div>
            {data && data.players.length > 1 ? (
              <label className="grid min-w-60 gap-2 text-sm font-bold">
                Athlete
                <select
                  className="rounded-md border border-white/30 bg-white px-3 py-2 font-normal text-black"
                  onChange={(event) => {
                    setPlayerId(event.target.value);
                    void load(event.target.value);
                  }}
                  value={selectedPlayer?.id ?? playerId}
                >
                  {data.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.preferredName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </section>

        {message ? <div className="mt-5"><AlertBanner>{message}</AlertBanner></div> : null}

        {signedOut ? (
          <section className="mt-5 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to open athlete home</h2>
            <p className="mt-2 leading-7 text-black/65">
              Athlete home requires an athlete invite or a parent-linked athlete opened from parent home.
            </p>
            <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
              Sign in
            </Link>
          </section>
        ) : selectedPlayer ? (
          <>
            <section className="mt-5 grid gap-4 md:grid-cols-4">
              <StatusCard eyebrow="Today" value={openAssignments.length} label="Routines still open" tone={openAssignments.length ? "warning" : "good"} />
              <StatusCard
                eyebrow="Safety"
                value={dashboard?.status === "modify_or_hold" || selectedPlayer.alerts.length ? "Modify" : "Clear"}
                label="Use current coach guidance"
                tone={dashboard?.status === "modify_or_hold" || selectedPlayer.alerts.length ? "warning" : "good"}
              />
              <StatusCard eyebrow="This week" value={selectedPlayer.weeklySummary.completedCount} label="Completed routines" />
              <StatusCard eyebrow="Reports" value={selectedPlayer.reports.length} label="Latest snapshots" />
            </section>

            {!selectedPlayer.consent.granted ? (
              <div className="mt-5">
                <AlertBanner tone="warning">
                  Consent is needed before routine updates or reports can be shown. A parent or guardian can grant it
                  from parent home.
                </AlertBanner>
              </div>
            ) : null}

            <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Today&apos;s Routine</h2>
                <div className="mt-4 grid gap-3">
                  {assignments.length ? (
                    assignments.map((assignment) => {
                      const doneToday = isDoneToday(assignment);

                      return (
                        <article className="rounded-md border border-black/10 p-4" key={assignment.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-black">{assignment.routine.name}</h3>
                              <p className="mt-1 text-sm text-black/65">
                                {assignment.routine.durationMin} min · {assignment.frequency}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${doneToday ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-900"}`}>
                              {doneToday ? "Done today" : "Open"}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className="rounded-md bg-[color:var(--team-primary)] px-4 py-2 font-bold text-white disabled:opacity-60"
                              disabled={submittingId === assignment.id || !selectedPlayer.consent.granted}
                              onClick={() =>
                                completeAssignment({
                                  assignmentId: assignment.id,
                                  playerId: selectedPlayer.id,
                                  completed: true,
                                  painDuring: false
                                })
                              }
                              type="button"
                            >
                              Complete
                            </button>
                            <button
                              className="rounded-md border border-black/20 px-4 py-2 font-bold disabled:opacity-60"
                              disabled={submittingId === assignment.id || !selectedPlayer.consent.granted}
                              onClick={() =>
                                completeAssignment({
                                  assignmentId: assignment.id,
                                  playerId: selectedPlayer.id,
                                  completed: false,
                                  painDuring: false
                                })
                              }
                              type="button"
                            >
                              Skip
                            </button>
                            <button
                              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 font-bold text-red-700 disabled:opacity-60"
                              disabled={submittingId === assignment.id || !selectedPlayer.consent.granted}
                              onClick={() =>
                                completeAssignment({
                                  assignmentId: assignment.id,
                                  playerId: selectedPlayer.id,
                                  completed: false,
                                  painDuring: true
                                })
                              }
                              type="button"
                            >
                              Pain
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <EmptyState title="No routine assigned today" description="There is no home routine open for this athlete right now." />
                  )}
                </div>
              </div>

              <aside className="grid gap-5">
                <section className="rounded-lg bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Goals</h2>
                  <div className="mt-4 grid gap-3">
                    {dashboard?.goals.length ? (
                      dashboard.goals.map((goal) => (
                        <article className="rounded-md border border-black/10 p-3" key={goal.id}>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">{goal.targetType}</p>
                          <h3 className="mt-1 font-black">{goal.targetValue ?? goal.metricDefinition?.displayName ?? "Personal goal"}</h3>
                          <p className="mt-1 text-sm text-black/65">{goal.dueDate ? `Due ${formatDate(goal.dueDate)}` : "No due date"}</p>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No active goals yet.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Reports</h2>
                  <div className="mt-4 grid gap-2">
                    {selectedPlayer.reports.length ? (
                      selectedPlayer.reports.map((report) => (
                        <Link
                          className="rounded-md border border-black/10 px-3 py-2 font-bold"
                          href={`/reports/view?reportId=${encodeURIComponent(report.id)}`}
                          key={report.id}
                        >
                          Report from {formatDate(report.generatedAt)}
                        </Link>
                      ))
                    ) : (
                      <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No reports yet.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Alerts</h2>
                  <div className="mt-4 grid gap-3">
                    {selectedPlayer.alerts.length ? (
                      selectedPlayer.alerts.map((alert) => (
                        <article className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-900" key={`${alert.reason}-${alert.nextAction}`}>
                          <p className="text-xs font-black uppercase tracking-[0.14em]">{alert.severity}</p>
                          <p className="mt-1 font-bold">{alert.reason}</p>
                          <p className="mt-1 text-sm">{alert.nextAction}</p>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-md bg-green-50 p-4 font-bold text-green-800">No open safety flags.</p>
                    )}
                  </div>
                </section>
              </aside>
            </section>
          </>
        ) : data ? (
          <EmptyState
            action={<Link className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">Sign in with an invite</Link>}
            description="Athlete home needs an athlete invitation or a parent-linked player."
            title="No linked athlete found"
          />
        ) : null}
      </section>
    </main>
  );
}
