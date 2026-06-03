"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Organization = {
  id: string;
  name: string;
  role: string;
};

type Team = {
  id: string;
  organizationId: string;
  name: string;
  role: string;
};

type PlayerOption = {
  id: string;
  preferredName: string;
};

type Goal = {
  id: string;
  playerId: string;
  targetType: string;
  targetValue: string | null;
  dueDate: string | null;
  status: "active" | "inactive" | "archived";
  createdAt: string;
  player: PlayerOption;
  metricDefinition: {
    displayName: string;
    unit: string | null;
  } | null;
};

type TeamDashboardPayload = {
  dashboard: {
    players: PlayerOption[];
  };
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "No due date";
}

export function GoalsManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [targetType, setTargetType] = useState("habit");
  const [targetValue, setTargetValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("Loading player context...");
  const [submitting, setSubmitting] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  const selectedPlayer = useMemo(() => players.find((player) => player.id === playerId), [playerId, players]);
  const teamsForOrganization = useMemo(
    () => teams.filter((team) => team.organizationId === organizationId),
    [organizationId, teams]
  );
  const visibleGoals = useMemo(
    () => goals.filter((goal) => !playerId || goal.playerId === playerId),
    [goals, playerId]
  );

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const response = await fetch("/api/me");
      const body = (await response.json()) as {
        organizations?: Organization[];
        teams?: Team[];
        linkedPlayers?: PlayerOption[];
        message?: string;
      };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setSignedOut(true);
        setMessage(body.message ?? "Sign in to manage player goals.");
        return;
      }

      setOrganizations(body.organizations ?? []);
      setTeams(body.teams ?? []);
      setPlayers(body.linkedPlayers ?? []);
      const firstOrganizationId = body.organizations?.[0]?.id ?? "";

      setOrganizationId(firstOrganizationId);
      setTeamId(body.teams?.find((team) => team.organizationId === firstOrganizationId)?.id ?? "");
      setPlayerId(body.linkedPlayers?.[0]?.id ?? "");
      setMessage("");
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTeamPlayers() {
      if (!teamId) {
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/dashboard`);
      const body = (await response.json()) as TeamDashboardPayload & { message?: string };

      if (!active || !response.ok) {
        return;
      }

      setPlayers((current) => {
        const next = new Map(current.map((player) => [player.id, player]));

        for (const player of body.dashboard.players) {
          next.set(player.id, player);
        }

        const values = Array.from(next.values()).sort((a, b) => a.preferredName.localeCompare(b.preferredName));

        if (!playerId && values[0]) {
          setPlayerId(values[0].id);
        }

        return values;
      });
    }

    void loadTeamPlayers();

    return () => {
      active = false;
    };
  }, [playerId, teamId]);

  function changeOrganization(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setTeamId(teams.find((team) => team.organizationId === nextOrganizationId)?.id ?? "");
    setPlayerId("");
  }

  useEffect(() => {
    let active = true;

    async function loadGoals() {
      if (!organizationId) {
        if (active) {
          setGoals([]);
        }
        return;
      }

      const response = await fetch(`/api/goals?organizationId=${encodeURIComponent(organizationId)}`);
      const body = (await response.json()) as { goals?: Goal[]; message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setMessage(body.message ?? "Could not load goals.");
        return;
      }

      setGoals(body.goals ?? []);
    }

    void loadGoals();

    return () => {
      active = false;
    };
  }, [organizationId]);

  async function reloadGoals(nextOrganizationId = organizationId) {
    if (!nextOrganizationId) {
      setGoals([]);
      return;
    }

    const response = await fetch(`/api/goals?organizationId=${encodeURIComponent(nextOrganizationId)}`);
    const body = (await response.json()) as { goals?: Goal[]; message?: string };

    if (!response.ok) {
      setMessage(body.message ?? "Could not load goals.");
      return;
    }

    setGoals(body.goals ?? []);
  }

  async function createGoal() {
    if (!organizationId || !playerId || !targetType) {
      setMessage("Choose an organization, player, and goal type first.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId,
        playerId,
        targetType,
        targetValue: targetValue || undefined,
        dueDate: dueDate || undefined
      })
    });
    const body = (await response.json()) as { goal?: Goal; message?: string };

    setSubmitting(false);

    if (!response.ok || !body.goal) {
      setMessage(body.message ?? "Could not create goal.");
      return;
    }

    setTargetValue("");
    setDueDate("");
    setMessage(`Created goal for ${selectedPlayer?.preferredName ?? "player"}.`);
    await reloadGoals();
  }

  async function updateGoalStatus(goalId: string, status: "active" | "inactive" | "archived") {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    const body = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(body.message ?? "Could not update goal.");
      return;
    }

    setMessage(status === "active" ? "Goal reactivated." : "Goal updated.");
    await reloadGoals();
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <section className="rounded-lg bg-[color:var(--accent-strong)] p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Player goals</p>
        <h1 className="mt-2 text-4xl font-black">Manage personal development goals</h1>
        <p className="mt-3 max-w-3xl leading-7">
          Create player-safe goals, keep active work visible on the player dashboard, and archive completed or stale
          goals.
        </p>
      </section>

      {message ? <p className="mt-5 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}

      {signedOut ? (
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to manage goals</h2>
          <p className="mt-2 leading-7 text-black/65">Goal management requires coach or administrator access.</p>
          <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
            Sign in
          </Link>
        </section>
      ) : (
        <>
      <section className="mt-6 grid gap-4 rounded-lg bg-white p-5 shadow-sm lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold">
          Organization
          <select
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => changeOrganization(event.target.value)}
            value={organizationId}
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name} ({organization.role})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Team
          <select
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => setTeamId(event.target.value)}
            value={teamId}
          >
            {teamsForOrganization.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.role})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Player
          <select
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => setPlayerId(event.target.value)}
            value={playerId}
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.preferredName}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Link
            className="w-full rounded-md border border-black/15 px-4 py-2 text-center font-bold"
            href={playerId ? `/dashboards/player?playerId=${encodeURIComponent(playerId)}` : "/dashboards/player"}
          >
            Open dashboard
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 rounded-lg bg-white p-5 shadow-sm lg:grid-cols-5">
        <label className="grid gap-2 text-sm font-bold">
          Goal type
          <select
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => setTargetType(event.target.value)}
            value={targetType}
          >
            <option value="habit">Habit</option>
            <option value="metric">Metric</option>
            <option value="routine">Routine</option>
            <option value="safety">Safety</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold lg:col-span-3">
          Goal
          <input
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => setTargetValue(event.target.value)}
            placeholder="Example: Complete warm-up routine 3 times this week"
            value={targetValue}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Due date
          <input
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </label>
        <div className="flex items-end lg:col-span-5">
          <button
            className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white disabled:opacity-60"
            disabled={submitting}
            onClick={createGoal}
            type="button"
          >
            {submitting ? "Creating..." : "Create goal"}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">
            Goals{selectedPlayer ? ` for ${selectedPlayer.preferredName}` : ""}
          </h2>
          <button className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" onClick={() => reloadGoals()} type="button">
            Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {visibleGoals.length ? (
            visibleGoals.map((goal) => (
              <article className="rounded-md border border-black/10 p-4" key={goal.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">
                      {goal.status} · {goal.targetType} · {formatDate(goal.dueDate)}
                    </p>
                    <h3 className="mt-1 text-lg font-black">{goal.targetValue ?? goal.metricDefinition?.displayName ?? "Goal"}</h3>
                    <p className="mt-1 text-sm text-black/65">{goal.player.preferredName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {goal.status === "active" ? (
                      <>
                        <button
                          className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold"
                          onClick={() => updateGoalStatus(goal.id, "inactive")}
                          type="button"
                        >
                          Complete
                        </button>
                        <button
                          className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold"
                          onClick={() => updateGoalStatus(goal.id, "archived")}
                          type="button"
                        >
                          Archive
                        </button>
                      </>
                    ) : (
                      <button
                        className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold"
                        onClick={() => updateGoalStatus(goal.id, "active")}
                        type="button"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No goals for this player yet.</p>
          )}
        </div>
      </section>
        </>
      )}
    </main>
  );
}
