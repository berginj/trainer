"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type MePayload = {
  organizations?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  teams?: Array<{
    id: string;
    organizationId: string;
    name: string;
    brand: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
  }>;
};

type Routine = {
  id: string;
  name: string;
  level: string;
  sport: string;
  durationMin: number;
  stopRules: unknown;
};

type Assignment = {
  id: string;
  frequency: string;
  dueDates: string[];
  routine: {
    name: string;
    durationMin: number;
  };
  completions: Array<{
    id: string;
    playerId: string;
    date: string;
    completed: boolean;
  }>;
};

function nextWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function RoutineBoard() {
  const [me, setMe] = useState<MePayload | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [dueDate, setDueDate] = useState(nextWeekDate());
  const [message, setMessage] = useState("Loading your team context...");
  const [signedOut, setSignedOut] = useState(false);
  const teamsForOrganization = useMemo(
    () => me?.teams?.filter((team) => team.organizationId === organizationId) ?? [],
    [me?.teams, organizationId]
  );
  const teamBrand = useMemo(
    () => me?.teams?.find((team) => team.id === teamId)?.brand ?? {
      primaryColor: "#7a1020",
      secondaryColor: "#f4c542",
      accentColor: "#ffffff"
    },
    [me, teamId]
  );

  async function loadAssignments() {
    if (!organizationId || !teamId) {
      return;
    }

    const response = await fetch(
      `/api/routine-assignments?organizationId=${encodeURIComponent(organizationId)}&teamId=${encodeURIComponent(teamId)}`
    );
    const body = (await response.json()) as { assignments?: Assignment[]; message?: string };

    if (!response.ok) {
      setMessage(body.message ?? "Could not load assignments.");
      return;
    }

    setAssignments(body.assignments ?? []);
    setMessage("");
  }

  useEffect(() => {
    let active = true;

    async function loadInitialMe() {
      const response = await fetch("/api/me");

      if (!response.ok || !active) {
        if (active) {
          setSignedOut(true);
          setMessage("Authentication is required.");
        }
        return;
      }

      const body = (await response.json()) as MePayload;
      const firstOrgId = body.organizations?.[0]?.id ?? "";
      const firstTeamId = body.teams?.find((team) => team.organizationId === firstOrgId)?.id ?? body.teams?.[0]?.id ?? "";

      setMe(body);
      setOrganizationId((current) => current || firstOrgId);
      setTeamId((current) => current || firstTeamId);
    }

    void loadInitialMe();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOrgRoutines() {
      if (!organizationId) {
        return;
      }

      const response = await fetch(`/api/routines?sport=basketball&organizationId=${encodeURIComponent(organizationId)}`);
      const body = (await response.json()) as { routines?: Routine[] };

      if (!active) {
        return;
      }

      setRoutines(body.routines ?? []);
      setSelectedRoutineId((current) => current || body.routines?.[0]?.id || "");
    }

    void loadOrgRoutines();

    return () => {
      active = false;
    };
  }, [organizationId]);

  useEffect(() => {
    let active = true;

    async function loadTeamAssignments() {
      if (!organizationId || !teamId) {
        return;
      }

      const response = await fetch(
        `/api/routine-assignments?organizationId=${encodeURIComponent(organizationId)}&teamId=${encodeURIComponent(teamId)}`
      );
      const body = (await response.json()) as { assignments?: Assignment[]; message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setMessage(body.message ?? "Could not load assignments.");
        return;
      }

      setAssignments(body.assignments ?? []);
      setMessage("");
    }

    void loadTeamAssignments();

    return () => {
      active = false;
    };
  }, [organizationId, teamId]);

  function changeOrganization(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setTeamId(me?.teams?.find((team) => team.organizationId === nextOrganizationId)?.id ?? "");
  }

  async function assignRoutine() {
    if (!organizationId || !teamId || !selectedRoutineId) {
      setMessage("Choose an organization, team, and routine first.");
      return;
    }

    const response = await fetch("/api/routine-assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId,
        teamId,
        routineId: selectedRoutineId,
        frequency,
        dueDates: dueDate ? [dueDate] : []
      })
    });
    const body = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(body.message ?? "Assignment failed.");
      return;
    }

    setMessage("Routine assigned to the team.");
    await loadAssignments();
  }

  return (
    <main
      className="min-h-screen px-4 py-6"
      style={
        {
          "--team-primary": teamBrand.primaryColor,
          "--team-secondary": teamBrand.secondaryColor,
          "--team-accent": teamBrand.accentColor
        } as CSSProperties
      }
    >
      <section className="mx-auto max-w-6xl">
        <div className="rounded-lg bg-[color:var(--team-primary)] p-5 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--team-secondary)]">
            Coach assignment board
          </p>
          <h1 className="mt-2 text-4xl font-black">Assign home work</h1>
          <p className="mt-3 max-w-2xl leading-7">
            Pick short basketball routines, assign them to the team, and watch completions come back from guardian home.
          </p>
        </div>

        {message ? <p className="mt-4 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}

        {signedOut ? (
          <section className="mt-5 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to assign routines</h2>
            <p className="mt-2 leading-7 text-black/65">Routine assignment requires coach or administrator access.</p>
            <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
              Sign in
            </Link>
          </section>
        ) : (
          <>
        <section className="mt-5 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Team context</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 font-bold">
              Organization
              <select
                className="rounded-md border border-black/20 p-3 font-normal"
                value={organizationId}
                onChange={(event) => changeOrganization(event.target.value)}
              >
                {me?.organizations?.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name} ({organization.role})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-bold">
              Team
              <select
                className="rounded-md border border-black/20 p-3 font-normal"
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
              >
                {teamsForOrganization.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Create assignment</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 font-bold">
                Routine
                <select
                  className="rounded-md border border-black/20 p-3 font-normal"
                  value={selectedRoutineId}
                  onChange={(event) => setSelectedRoutineId(event.target.value)}
                >
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name} · {routine.durationMin} min
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 font-bold">
                Frequency
                <input className="rounded-md border border-black/20 p-3 font-normal" value={frequency} onChange={(event) => setFrequency(event.target.value)} />
              </label>
              <label className="grid gap-2 font-bold">
                Due date
                <input className="rounded-md border border-black/20 p-3 font-normal" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>
              <button className="rounded-md bg-[color:var(--team-primary)] px-4 py-3 font-bold text-white" onClick={assignRoutine} type="button">
                Assign to team
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Active assignments</h2>
            <div className="mt-4 grid gap-3">
              {assignments.map((assignment) => (
                <article className="rounded-md border border-black/10 p-3" key={assignment.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">{assignment.routine.name}</h3>
                      <p className="text-sm text-black/65">
                        {assignment.routine.durationMin} min · {assignment.frequency}
                      </p>
                    </div>
                    <span className="rounded-full bg-[color:var(--team-secondary)] px-3 py-1 text-sm font-bold text-black">
                      {assignment.completions.length} completions
                    </span>
                  </div>
                </article>
              ))}
              {!assignments.length ? (
                <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No active assignments loaded.</p>
              ) : null}
            </div>
          </div>
        </section>
          </>
        )}
      </section>
    </main>
  );
}
