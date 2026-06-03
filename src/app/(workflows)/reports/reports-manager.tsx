"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type ReportListItem = {
  id: string;
  reportType: string;
  generatedAt: string;
  playerId: string | null;
  playerName: string | null;
  teamId: string | null;
  teamName: string | null;
};

type TeamDashboardPayload = {
  dashboard: {
    players: PlayerOption[];
  };
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function ReportsManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [message, setMessage] = useState("Loading report context...");
  const [submitting, setSubmitting] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const selectedPlayer = useMemo(() => players.find((player) => player.id === playerId), [playerId, players]);
  const teamsForOrganization = useMemo(
    () => teams.filter((team) => team.organizationId === organizationId),
    [organizationId, teams]
  );
  const canGenerateReports = useMemo(
    () => roles.some((role) => ["platform_admin", "org_admin", "team_coach", "assistant_coach", "evaluator"].includes(role)),
    [roles]
  );

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const params = new URLSearchParams(window.location.search);
      const requestedPlayerId = params.get("playerId") ?? "";
      const response = await fetch("/api/me");
      const body = (await response.json()) as {
        access?: { roles: string[] };
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
        setMessage(body.message ?? "Sign in to generate reports.");
        return;
      }

      setOrganizations(body.organizations ?? []);
      setTeams(body.teams ?? []);
      setPlayers(body.linkedPlayers ?? []);
      setRoles(body.access?.roles ?? []);
      const firstOrganizationId = body.organizations?.[0]?.id ?? "";

      setOrganizationId(firstOrganizationId);
      setTeamId(body.teams?.find((team) => team.organizationId === firstOrganizationId)?.id ?? "");
      setPlayerId(requestedPlayerId || body.linkedPlayers?.[0]?.id || "");
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
      if (!teamId || !canGenerateReports) {
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

        if (!canGenerateReports && !playerId && values[0]) {
          setPlayerId(values[0].id);
        }

        return values;
      });
    }

    void loadTeamPlayers();

    return () => {
      active = false;
    };
  }, [canGenerateReports, playerId, teamId]);

  function changeOrganization(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setTeamId(teams.find((team) => team.organizationId === nextOrganizationId)?.id ?? "");
    setPlayerId("");
  }

  const loadReports = useCallback(async (nextOrganizationId = organizationId, nextPlayerId = playerId) => {
    if (!nextOrganizationId) {
      setReports([]);
      return;
    }

    const params = new URLSearchParams({ organizationId: nextOrganizationId });

    if (nextPlayerId) {
      params.set("playerId", nextPlayerId);
    }

    const response = await fetch(`/api/reports?${params.toString()}`);
    const body = (await response.json()) as { reports?: ReportListItem[]; message?: string };

    if (!response.ok) {
      setMessage(body.message ?? "Could not load reports.");
      return;
    }

    setReports(body.reports ?? []);
  }, [organizationId, playerId]);

  useEffect(() => {
    let active = true;

    async function loadOrganizationReports() {
      if (!organizationId) {
        if (active) {
          setReports([]);
        }
        return;
      }

      const params = new URLSearchParams({ organizationId });

      if (!canGenerateReports && playerId) {
        params.set("playerId", playerId);
      }

      const response = await fetch(`/api/reports?${params.toString()}`);
      const body = (await response.json()) as { reports?: ReportListItem[]; message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setMessage(body.message ?? "Could not load reports.");
        return;
      }

      setReports(body.reports ?? []);
    }

    void loadOrganizationReports();

    return () => {
      active = false;
    };
  }, [canGenerateReports, organizationId, playerId]);

  async function generateReport() {
    if (!canGenerateReports) {
      setMessage("Parent and athlete accounts can review reports, but report generation is a coach or admin action.");
      return;
    }

    if (!organizationId || !playerId) {
      setMessage("Choose an organization and player first.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId,
        playerId
      })
    });
    const body = (await response.json()) as { report?: { id: string }; message?: string };

    setSubmitting(false);

    if (!response.ok || !body.report) {
      setMessage(body.message ?? "Could not generate report.");
      return;
    }

    setMessage(`Generated report for ${selectedPlayer?.preferredName ?? "player"}.`);
    await loadReports(organizationId);
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <section className="rounded-lg bg-[color:var(--accent-strong)] p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Reports</p>
        <h1 className="mt-2 text-4xl font-black">
          {canGenerateReports ? "Generate monthly player snapshots" : "Player report center"}
        </h1>
        <p className="mt-3 max-w-3xl leading-7">
          {canGenerateReports
            ? "Create immutable report snapshots from the current database state, then review or print them from the report viewer."
            : "Review linked-player reports in a parent- and athlete-safe view."}
        </p>
      </section>

      {message ? <p className="mt-5 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}

      {signedOut ? (
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to view reports</h2>
          <p className="mt-2 leading-7 text-black/65">Reports are limited to linked athletes, coaches, and administrators.</p>
          <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
            Sign in
          </Link>
        </section>
      ) : (
        <>
      <section className={`mt-6 grid gap-4 rounded-lg bg-white p-5 shadow-sm ${canGenerateReports ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {canGenerateReports ? (
          <>
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
          </>
        ) : (
          <div className="rounded-md bg-[color:var(--panel)] p-4 lg:col-span-2">
            <p className="font-bold">Read-only report access</p>
            <p className="mt-1 text-sm text-black/65">
              This view lists reports for linked athletes only. Coaches or admins generate new reports.
            </p>
          </div>
        )}
        <label className="grid gap-2 text-sm font-bold">
          Player
          <select
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => setPlayerId(event.target.value)}
            value={playerId}
          >
            {canGenerateReports ? <option value="">All players</option> : null}
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.preferredName}
              </option>
            ))}
            {playerId && players.every((player) => player.id !== playerId) ? (
              <option value={playerId}>Selected player</option>
            ) : null}
          </select>
        </label>
        {canGenerateReports ? (
          <div className="flex items-end">
          <button
            className="w-full rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white disabled:opacity-60"
            disabled={submitting}
            onClick={generateReport}
            type="button"
          >
            {submitting ? "Generating..." : "Generate report"}
          </button>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Recent reports</h2>
          <button className="rounded-md border border-black/15 px-3 py-2 text-sm font-bold" onClick={() => loadReports()} type="button">
            Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {reports.length ? (
            reports.map((report) => (
              <article className="rounded-md border border-black/10 p-4" key={report.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{report.playerName ?? report.teamName ?? "Report"}</h3>
                    <p className="text-sm text-black/65">
                      {report.reportType} · {formatDate(report.generatedAt)}
                    </p>
                  </div>
                  <Link
                    className="rounded-md bg-[color:var(--accent-strong)] px-3 py-2 text-sm font-bold text-white"
                    href={`/reports/view?reportId=${encodeURIComponent(report.id)}`}
                  >
                    View report
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-md bg-[color:var(--panel)] p-4 font-bold">No reports generated yet.</p>
          )}
        </div>
      </section>
        </>
      )}
    </main>
  );
}
