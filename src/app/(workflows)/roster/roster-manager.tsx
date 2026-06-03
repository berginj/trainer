"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MePayload = {
  organizations: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
  }>;
  teams: Array<{
    id: string;
    organizationId: string;
    name: string;
    role: string;
  }>;
};

type PlayerDraft = {
  key: string;
  preferredName: string;
  dateOfBirth: string;
  sexAtBirth: string;
  positions: string;
  dominantHand: string;
  guardianEmail: string;
  guardianName: string;
};

type RowResult = {
  key: string;
  ok: boolean;
  message: string;
  inviteUrl?: string;
};

function newDraft(): PlayerDraft {
  return {
    key: crypto.randomUUID(),
    preferredName: "",
    dateOfBirth: "",
    sexAtBirth: "",
    positions: "",
    dominantHand: "",
    guardianEmail: "",
    guardianName: ""
  };
}

function draftHasData(draft: PlayerDraft) {
  return Object.entries(draft)
    .filter(([key]) => key !== "key")
    .some(([, value]) => value.trim());
}

function validationMessages(draft: PlayerDraft) {
  const messages: string[] = [];

  if (!draftHasData(draft)) {
    return messages;
  }

  if (!draft.preferredName.trim()) {
    messages.push("Preferred name is required.");
  }

  if (!draft.dateOfBirth) {
    messages.push("Date of birth is required.");
  }

  if (draft.guardianEmail && !draft.guardianEmail.includes("@")) {
    messages.push("Guardian email must look like an email address.");
  }

  return messages;
}

async function readJson(response: Response) {
  const text = await response.text();

  return text
    ? (JSON.parse(text) as {
        message?: string;
        player?: { id: string; preferredName: string };
        inviteUrl?: string;
      })
    : {};
}

export function RosterManager() {
  const [me, setMe] = useState<MePayload | null>(null);
  const [message, setMessage] = useState("Loading your organizations and teams...");
  const [organizationId, setOrganizationId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [drafts, setDrafts] = useState<PlayerDraft[]>([newDraft(), newDraft(), newDraft()]);
  const [results, setResults] = useState<RowResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const selectedOrganization = useMemo(
    () => me?.organizations.find((organization) => organization.id === organizationId),
    [me, organizationId]
  );
  const teamsForOrganization = useMemo(
    () => me?.teams.filter((team) => team.organizationId === organizationId) ?? [],
    [me?.teams, organizationId]
  );
  const selectedTeam = useMemo(() => me?.teams.find((team) => team.id === teamId), [me, teamId]);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const response = await fetch("/api/me");
      const body = (await response.json()) as MePayload & { message?: string };

      if (!active) {
        return;
      }

      if (!response.ok) {
        setSignedOut(true);
        setMessage(body.message ?? "Sign in before managing the roster.");
        return;
      }

      setMe(body);
      const firstOrganizationId = body.organizations[0]?.id ?? "";

      setOrganizationId(firstOrganizationId);
      setTeamId(body.teams.find((team) => team.organizationId === firstOrganizationId)?.id ?? "");
      setMessage("");
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, []);

  function updateDraft(key: string, patch: Partial<PlayerDraft>) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  function changeOrganization(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setTeamId(me?.teams.find((team) => team.organizationId === nextOrganizationId)?.id ?? "");
  }

  function removeDraft(key: string) {
    setDrafts((current) => (current.length === 1 ? current : current.filter((draft) => draft.key !== key)));
  }

  async function submitRoster() {
    const rows = drafts.filter(draftHasData);

    setResults([]);

    if (!organizationId || !teamId) {
      setMessage("Choose an organization and team first.");
      return;
    }

    if (rows.length === 0) {
      setMessage("Add at least one player.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const nextResults: RowResult[] = [];

    for (const draft of rows) {
      if (!draft.preferredName.trim() || !draft.dateOfBirth) {
        nextResults.push({
          key: draft.key,
          ok: false,
          message: "Name and date of birth are required."
        });
        continue;
      }

      const playerResponse = await fetch("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId,
          preferredName: draft.preferredName.trim(),
          dateOfBirth: draft.dateOfBirth,
          sexAtBirth: draft.sexAtBirth.trim() || undefined,
          sports: ["basketball"],
          positions: draft.positions
            .split(",")
            .map((position) => position.trim())
            .filter(Boolean),
          dominantHand: draft.dominantHand.trim() || undefined
        })
      });
      const playerBody = await readJson(playerResponse);

      if (!playerResponse.ok || !playerBody.player) {
        nextResults.push({
          key: draft.key,
          ok: false,
          message: playerBody.message ?? "Could not create player."
        });
        continue;
      }

      const assignResponse = await fetch("/api/team-players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teamId,
          playerId: playerBody.player.id
        })
      });
      const assignBody = await readJson(assignResponse);
      let inviteUrl: string | undefined;
      let inviteError: string | undefined;

      if (assignResponse.ok && draft.guardianEmail.trim()) {
        const inviteResponse = await fetch("/api/invitations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            organizationId,
            playerId: playerBody.player.id,
            email: draft.guardianEmail.trim(),
            role: "guardian",
            relationship: draft.guardianName.trim() || "guardian"
          })
        });
        const inviteBody = await readJson(inviteResponse);

        if (inviteResponse.ok) {
          inviteUrl = inviteBody.inviteUrl;
        } else {
          inviteError = inviteBody.message ?? "Guardian invite could not be created.";
        }
      }

      nextResults.push({
        key: draft.key,
        ok: assignResponse.ok && !inviteError,
        message: assignResponse.ok
          ? inviteError
            ? `Added ${playerBody.player.preferredName}, but ${inviteError}`
            : `Added ${playerBody.player.preferredName} to ${selectedTeam?.name ?? "team"}.`
          : assignBody.message ?? `Created ${playerBody.player.preferredName}, but could not assign team.`,
        inviteUrl
      });
    }

    setResults(nextResults);
    setSubmitting(false);

    if (nextResults.every((result) => result.ok)) {
      setDrafts([newDraft(), newDraft(), newDraft()]);
      setMessage(`Added ${nextResults.length} player${nextResults.length === 1 ? "" : "s"}.`);
    }
  }

  async function copyInviteLink(inviteUrl: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage("Invite link copied.");
    } catch {
      setMessage("Could not copy the invite link in this browser.");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <section className="border-b border-black/10 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Roster setup</p>
        <h1 className="mt-2 text-4xl font-black text-[color:var(--accent-strong)]">Add players without hunting for IDs</h1>
        <p className="mt-3 max-w-3xl leading-7">
          Choose one of your organizations and teams, then enter several players at once. Each player is created and
          assigned to the selected team. Guardian invite links are generated for rows with guardian emails.
        </p>
      </section>

      {message ? <p className="mt-5 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}

      {signedOut ? (
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Sign in to manage roster</h2>
          <p className="mt-2 leading-7 text-black/65">Roster tools require coach or administrator access.</p>
          <Link className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/signin">
            Sign in
          </Link>
        </section>
      ) : (
        <>

      <section className="mt-6 grid gap-4 rounded-lg border border-black/10 bg-white p-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">
          Organization
          <select
            className="rounded-md border border-black/20 px-3 py-2 font-normal"
            onChange={(event) => changeOrganization(event.target.value)}
            value={organizationId}
          >
            {me?.organizations.map((organization) => (
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
        <div className="rounded-md bg-[color:var(--panel)] p-3 text-sm md:col-span-2">
          <p className="font-bold">
            Adding players to {selectedTeam?.name ?? "no team selected"} in {selectedOrganization?.name ?? "no organization selected"}.
          </p>
          <p className="mt-1 text-black/65">
            IDs stay in the background for this workflow. Choose the named organization and team, then submit roster rows.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        {drafts.map((draft, index) => {
          const result = results.find((item) => item.key === draft.key);
          const rowValidation = validationMessages(draft);

          return (
            <article className="rounded-lg border border-black/10 bg-white p-4" key={draft.key}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[color:var(--accent-strong)]">Player {index + 1}</h2>
                <button
                  className="rounded-md border border-black/15 px-3 py-1 text-sm font-bold"
                  onClick={() => removeDraft(draft.key)}
                  type="button"
                >
                  Remove
                </button>
              </div>
              {rowValidation.length ? (
                <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm font-bold text-yellow-900">
                  {rowValidation.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-5">
                <label className="grid gap-1 text-sm font-bold md:col-span-2">
                  Preferred name
                  <input
                    className="rounded-md border border-black/20 px-3 py-2 font-normal"
                    onChange={(event) => updateDraft(draft.key, { preferredName: event.target.value })}
                    placeholder="Avery"
                    value={draft.preferredName}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Date of birth
                  <input
                    className="rounded-md border border-black/20 px-3 py-2 font-normal"
                    onChange={(event) => updateDraft(draft.key, { dateOfBirth: event.target.value })}
                    type="date"
                    value={draft.dateOfBirth}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Sex at birth
                  <input
                    className="rounded-md border border-black/20 px-3 py-2 font-normal"
                    onChange={(event) => updateDraft(draft.key, { sexAtBirth: event.target.value })}
                    placeholder="optional"
                    value={draft.sexAtBirth}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Dominant hand
                  <input
                    className="rounded-md border border-black/20 px-3 py-2 font-normal"
                    onChange={(event) => updateDraft(draft.key, { dominantHand: event.target.value })}
                    placeholder="optional"
                    value={draft.dominantHand}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold md:col-span-5">
                  Positions, comma-separated
                  <input
                    className="rounded-md border border-black/20 px-3 py-2 font-normal"
                    onChange={(event) => updateDraft(draft.key, { positions: event.target.value })}
                    placeholder="guard, wing"
                    value={draft.positions}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold md:col-span-3">
                  Guardian email for invite
                  <input
                    className="rounded-md border border-black/20 px-3 py-2 font-normal"
                    onChange={(event) => updateDraft(draft.key, { guardianEmail: event.target.value })}
                    placeholder="parent@example.com"
                    type="email"
                    value={draft.guardianEmail}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold md:col-span-2">
                  Guardian relationship
                  <input
                    className="rounded-md border border-black/20 px-3 py-2 font-normal"
                    onChange={(event) => updateDraft(draft.key, { guardianName: event.target.value })}
                    placeholder="guardian"
                    value={draft.guardianName}
                  />
                </label>
              </div>
              {result ? (
                <p className={`mt-3 rounded-md p-3 text-sm font-bold ${result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  {result.message}
                  {result.inviteUrl ? (
                    <span className="mt-3 flex flex-wrap gap-2">
                      <a className="rounded-md bg-white px-3 py-2 text-green-900 underline" href={result.inviteUrl}>
                        Open invite
                      </a>
                      <button
                        className="rounded-md bg-white px-3 py-2 text-green-900"
                        onClick={() => result.inviteUrl && copyInviteLink(result.inviteUrl)}
                        type="button"
                      >
                        Copy invite link
                      </button>
                    </span>
                  ) : null}
                </p>
              ) : null}
            </article>
          );
        })}
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-md border border-[color:var(--accent-strong)]/20 px-4 py-2 font-bold text-[color:var(--accent-strong)]"
          onClick={() => setDrafts((current) => [...current, newDraft()])}
          type="button"
        >
          Add another row
        </button>
        <button
          className="rounded-md bg-[color:var(--accent-strong)] px-5 py-2 font-bold text-white disabled:opacity-60"
          disabled={submitting}
          onClick={submitRoster}
          type="button"
        >
          {submitting ? "Adding players..." : "Add players to roster"}
        </button>
      </div>

      {results.length ? (
        <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Next steps</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link className="rounded-md border border-black/10 p-4 font-bold" href="/dashboards/team">
              Review Team Today
            </Link>
            <Link className="rounded-md border border-black/10 p-4 font-bold" href="/routines">
              Assign starter routines
            </Link>
            <Link className="rounded-md border border-black/10 p-4 font-bold" href="/reports">
              Open report center
            </Link>
          </div>
        </section>
      ) : null}
        </>
      )}
    </main>
  );
}
