"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActionCard, AlertBanner, EmptyState, ProductShell, StatusCard, type PersonaKind, type PersonaSummary } from "./_components/product-shell";

type NextAction = {
  persona: PersonaKind;
  label: string;
  href: string;
  priority: number;
};

type MePayload = {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  personas: PersonaSummary[];
  nextActions: NextAction[];
  organizations: Array<{ id: string; name: string; role: string }>;
  teams: Array<{ id: string; name: string; role: string }>;
  linkedPlayers: Array<{ id: string; preferredName: string }>;
  message?: string;
};

const personaCopy: Record<PersonaKind, { title: string; description: string; empty: string }> = {
  administrator: {
    title: "Administrator Control Center",
    description: "Launch readiness, consent gaps, roster health, alerts, benchmarks, and audit activity.",
    empty: "Admin actions appear after your account is assigned platform or organization admin access."
  },
  coach: {
    title: "Coach Team Today",
    description: "Start with availability, modify/hold flags, roster gaps, routine shortcuts, and reports.",
    empty: "Coach actions appear after your account is assigned to a team."
  },
  parent: {
    title: "Parent Home",
    description: "See what each linked athlete needs today, consent status, home routines, alerts, and reports.",
    empty: "Parent actions appear after you accept a guardian invite for a player."
  },
  athlete: {
    title: "Athlete Home",
    description: "Review today's routine, personal goals, safe alerts, and latest reports.",
    empty: "Athlete actions appear after an athlete invite links your account to a player."
  }
};

function defaultPersona(personas: PersonaSummary[]) {
  return personas.find((persona) => persona.primary)?.kind ?? personas[0]?.kind ?? "parent";
}

export function RoleAwareHome({ initialSignedOut = false }: { initialSignedOut?: boolean }) {
  const [me, setMe] = useState<MePayload | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaKind>("parent");
  const [message, setMessage] = useState(
    initialSignedOut ? "Sign in with your invited account to open Trainer." : "Loading your workspace..."
  );
  const [signedOut, setSignedOut] = useState(initialSignedOut);

  useEffect(() => {
    if (initialSignedOut) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/me");
        const body = (await response.json()) as MePayload & { message?: string };

        if (!active) {
          return;
        }

        if (!response.ok) {
          setSignedOut(true);
          setMessage(body.message ?? "Sign in with your invited account to open Trainer.");
          return;
        }

        setMe(body);
        setSelectedPersona(defaultPersona(body.personas));
        setMessage("");
      } catch {
        if (!active) {
          return;
        }

        setSignedOut(true);
        setMessage("Sign in with your invited account to open Trainer.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [initialSignedOut]);

  const selectedCopy = personaCopy[selectedPersona];
  const selectedActions = useMemo(
    () =>
      (me?.nextActions ?? [])
        .filter((action) => action.persona === selectedPersona)
        .sort((a, b) => a.priority - b.priority),
    [me?.nextActions, selectedPersona]
  );
  const selectedPersonaSummary = me?.personas.find((persona) => persona.kind === selectedPersona);

  if (signedOut) {
    return (
      <ProductShell
        title="Sign In To Trainer"
        eyebrow="Product home"
        description="Use the Google or Microsoft account tied to your invitation. After sign-in, Trainer opens the right home for your role."
        user={null}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Your role decides what opens first</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatusCard eyebrow="Parent" value="Home plan" label="Linked children, consent, routines, reports." />
              <StatusCard eyebrow="Athlete" value="Today" label="Safe routine and personal progress." />
              <StatusCard eyebrow="Coach" value="Team Today" label="Availability, modify list, roster gaps." />
              <StatusCard eyebrow="Admin" value="Readiness" label="Setup, consent, alerts, audit activity." />
            </div>
          </section>
          <section className="rounded-lg bg-[color:var(--accent-strong)] p-6 text-white shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--warning)]">Access required</p>
            <h2 className="mt-3 text-3xl font-black">Open your invited workspace</h2>
            <p className="mt-3 leading-7 text-white/80">{message}</p>
            <Link className="mt-5 inline-block rounded-md bg-white px-4 py-2 font-bold text-[color:var(--accent-strong)]" href="/signin">
              Sign in
            </Link>
          </section>
        </div>
      </ProductShell>
    );
  }

  return (
    <ProductShell
      title={selectedCopy.title}
      eyebrow="Role home"
      description={selectedCopy.description}
      user={me?.user}
      personas={me?.personas ?? []}
      selectedPersona={selectedPersona}
      onPersonaChange={setSelectedPersona}
      actions={
        selectedPersonaSummary ? (
          <Link className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href={selectedPersonaSummary.href}>
            Open {selectedPersonaSummary.label}
          </Link>
        ) : null
      }
    >
      {message ? <AlertBanner>{message}</AlertBanner> : null}
      {me ? (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatusCard eyebrow="Organizations" value={me.organizations.length} label="Active access scopes" />
            <StatusCard eyebrow="Teams" value={me.teams.length} label="Assigned coaching contexts" tone={me.teams.length ? "good" : "neutral"} />
            <StatusCard eyebrow="Linked athletes" value={me.linkedPlayers.length} label="Parent or athlete access" tone={me.linkedPlayers.length ? "good" : "neutral"} />
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            {selectedActions.length ? (
              selectedActions.map((action) => (
                <ActionCard
                  cta="Start"
                  description={action.label}
                  href={action.href}
                  key={`${action.persona}-${action.href}-${action.label}`}
                  priority={action.priority}
                  title={action.label}
                />
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState title="No next actions yet" description={selectedCopy.empty} />
              </div>
            )}
          </section>
        </div>
      ) : (
        <AlertBanner>Loading your role-aware home...</AlertBanner>
      )}
    </ProductShell>
  );
}
