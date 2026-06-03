"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/app/_components/product-shell";

type GuardianHomePayload = {
  players: Array<{
    id: string;
    organizationId: string;
    preferredName: string;
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
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function GuardianHome() {
  const [data, setData] = useState<GuardianHomePayload | null>(null);
  const [message, setMessage] = useState("Loading assignments...");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const primaryBrand = useMemo(
    () => data?.players[0]?.teams[0]?.brand ?? { primaryColor: "#7a1020", secondaryColor: "#f4c542", accentColor: "#ffffff" },
    [data]
  );

  const load = useCallback(async () => {
    const response = await fetch("/api/guardian/home");
    const body = (await response.json()) as GuardianHomePayload & { message?: string };

    if (!response.ok) {
      setSignedOut(true);
      setMessage(body.message ?? "Sign in with your invited Google or Microsoft account to view assignments.");
      return;
    }

    setSignedOut(false);
    setData(body);
    setMessage("");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      const response = await fetch("/api/guardian/home");
      const body = (await response.json()) as GuardianHomePayload & { message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setSignedOut(true);
        setMessage(body.message ?? "Sign in with your invited Google or Microsoft account to view assignments.");
        return;
      }

      setSignedOut(false);
      setData(body);
      setMessage("");
    }

    void loadInitial();

    return () => {
      active = false;
    };
  }, []);

  async function completeAssignment(input: {
    assignmentId: string;
    playerId: string;
    completed: boolean;
    painDuring: boolean;
  }) {
    setSubmittingId(input.assignmentId);
    const player = data?.players.find((item) => item.id === input.playerId);
    const response = await fetch("/api/routine-completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId: data?.assignments.find((assignment) => assignment.id === input.assignmentId)?.organizationId ?? "",
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
      setMessage(body.message ?? `Could not save completion for ${player?.preferredName ?? "player"}.`);
      return;
    }

    setMessage(
      input.painDuring
        ? `Saved pain flag for ${player?.preferredName ?? "athlete"}. Pause this activity and tell the coach before repeating it.`
        : input.completed
          ? `Saved completion for ${player?.preferredName ?? "athlete"}.`
          : `Saved skipped routine for ${player?.preferredName ?? "athlete"}.`
    );
    await load();
  }

  async function grantConsent(playerId: string) {
    const player = data?.players.find((item) => item.id === playerId);

    if (!player) {
      return;
    }

    const response = await fetch("/api/guardian/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId: player.organizationId,
        playerId: player.id,
        version: "cyclones_mvp_v1"
      })
    });
    const body = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(body.message ?? "Could not record consent.");
      return;
    }

    setMessage("Consent recorded. You can now mark assignments.");
    await load();
  }

  return (
    <main
      className="min-h-screen px-4 py-6"
      style={
        {
          "--team-primary": primaryBrand.primaryColor,
          "--team-secondary": primaryBrand.secondaryColor,
          "--team-accent": primaryBrand.accentColor
        } as CSSProperties
      }
    >
      <section className="mx-auto max-w-5xl">
        <div className="rounded-lg bg-[color:var(--team-primary)] p-5 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--team-secondary)]">
            Parent home
          </p>
          <h1 className="mt-2 text-4xl font-black">Today&apos;s plan for linked athletes</h1>
          <p className="mt-3 max-w-2xl leading-7">
            Mark what got done, note skipped work, and flag pain so the coach can adjust the plan.
          </p>
        </div>

        {message ? <p className="mt-4 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}

        {signedOut ? (
          <section className="mt-5 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to open parent home</h2>
            <p className="mt-2 leading-7 text-black/65">
              Parent home shows linked athletes, consent, home routines, safety flags, and reports after you accept a
              guardian invite.
            </p>
            <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
              Sign in
            </Link>
          </section>
        ) : (
        <div className="mt-5 grid gap-4">
          {data?.players.length === 0 ? (
            <EmptyState
              description="Accept a guardian invite from the team to link a child athlete to this account."
              title="No linked athletes yet"
            />
          ) : null}
          {data?.players.map((player) => {
            const playerAssignments = data.assignments.filter((assignment) => assignment.playerId === player.id);
            const openTodayCount = playerAssignments.filter(
              (assignment) =>
                !assignment.completions.some(
                  (completion) => completion.date.slice(0, 10) === today() && completion.completed
                )
            ).length;
            const latestReport = player.reports[0];

            return (
            <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm" key={player.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">{player.preferredName}</h2>
                  <p className="text-sm font-bold text-black/60">
                    {player.teams.map((team) => team.name).join(", ") || "No active team"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[color:var(--team-secondary)] px-3 py-1 text-sm font-bold text-black">
                    {player.consent.granted ? "Consent active" : "Consent needed"}
                  </span>
                  <Link
                    className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold"
                    href={`/athlete/home?mode=child&playerId=${encodeURIComponent(player.id)}`}
                  >
                    Open athlete view
                  </Link>
                </div>
              </div>

              {!player.consent.granted ? (
                <div className="mt-4 rounded-md border border-[color:var(--team-secondary)] bg-yellow-50 p-3">
                  <p className="text-sm">
                    Guardian consent is required before recording readiness, workload, reports, or routine completion
                    notes for this player.
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    Routine buttons stay disabled until consent is recorded.
                  </p>
                  <button
                    className="mt-3 rounded-md bg-[color:var(--team-primary)] px-4 py-2 font-bold text-white"
                    onClick={() => grantConsent(player.id)}
                    type="button"
                  >
                    Grant required consent
                  </button>
                </div>
              ) : null}

              {player.alerts.length ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
                  {player.alerts.map((alert) => (
                    <p className="text-sm" key={`${alert.reason}-${alert.nextAction}`}>
                      <strong>{alert.severity.toUpperCase()}:</strong> {alert.reason} {alert.nextAction}
                    </p>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-md bg-[color:var(--panel)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Today</p>
                  <p className="mt-2 text-2xl font-black text-[color:var(--accent-strong)]">
                    {openTodayCount} open
                  </p>
                  <p className="mt-1 text-sm text-black/65">
                    {openTodayCount ? "Routines need a check-in." : "Nothing open for today."}
                  </p>
                </div>
                <div className="rounded-md bg-[color:var(--panel)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">This week</p>
                  <p className="mt-2 text-2xl font-black text-[color:var(--accent-strong)]">
                    {player.weeklySummary.completedCount} done
                  </p>
                  <p className="mt-1 text-sm text-black/65">
                    {player.weeklySummary.skippedCount} skipped · {player.weeklySummary.painCount} pain flags
                  </p>
                </div>
                <div className="rounded-md bg-[color:var(--panel)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Latest reports</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {latestReport ? (
                        <Link
                          className="rounded-md bg-white px-3 py-2 text-sm font-bold text-[color:var(--accent-strong)]"
                          href={`/reports/view?reportId=${encodeURIComponent(latestReport.id)}`}
                        >
                          {formatDate(latestReport.generatedAt)}
                        </Link>
                    ) : (
                      <p className="text-sm font-bold text-black/65">No reports generated yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {playerAssignments.length ? (
                  playerAssignments.map((assignment) => {
                    const completedToday = assignment.completions.some(
                      (completion) => completion.date.slice(0, 10) === today() && completion.completed
                    );

                    return (
                      <article className="rounded-md border border-black/10 p-4" key={`${assignment.id}-${player.id}`}>
                        <div className="flex flex-wrap justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-black">{assignment.routine.name}</h3>
                            <p className="text-sm text-black/65">
                              {assignment.routine.durationMin} min · {assignment.frequency}
                            </p>
                          </div>
                          <span className="text-sm font-bold">{completedToday ? "Done today" : "Open"}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded-md bg-[color:var(--team-primary)] px-4 py-2 font-bold text-white disabled:opacity-60"
                            disabled={submittingId === assignment.id || !player.consent.granted}
                            onClick={() =>
                              completeAssignment({
                                assignmentId: assignment.id,
                                playerId: player.id,
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
                            disabled={submittingId === assignment.id || !player.consent.granted}
                            onClick={() =>
                              completeAssignment({
                                assignmentId: assignment.id,
                                playerId: player.id,
                                completed: false,
                                painDuring: false
                              })
                            }
                            type="button"
                          >
                            Skipped
                          </button>
                          <button
                            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 font-bold text-red-700 disabled:opacity-60"
                            disabled={submittingId === assignment.id || !player.consent.granted}
                            onClick={() =>
                              completeAssignment({
                                assignmentId: assignment.id,
                                playerId: player.id,
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
                  <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">
                    No home routines are assigned right now.
                  </p>
                )}
              </div>
            </section>
          );
          })}
        </div>
        )}
      </section>
    </main>
  );
}
