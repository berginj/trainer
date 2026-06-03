"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type PersonaKind = "administrator" | "coach" | "parent" | "athlete";

export type PersonaSummary = {
  kind: PersonaKind;
  label: string;
  href: string;
  primary: boolean;
};

type ProductShellProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  user?: {
    displayName: string;
    email: string;
  } | null;
  personas?: PersonaSummary[];
  selectedPersona?: PersonaKind;
  onPersonaChange?: (persona: PersonaKind) => void;
  actions?: ReactNode;
  children: ReactNode;
};

type StatusCardProps = {
  eyebrow: string;
  value: string | number;
  label?: string;
  tone?: "neutral" | "good" | "warning" | "danger" | "info";
};

type ActionCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  href: string;
  cta?: string;
  priority?: number;
};

const toneClasses = {
  neutral: "border-black/10 bg-white text-[color:var(--foreground)]",
  good: "border-green-200 bg-green-50 text-green-900",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-950",
  danger: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900"
} as const;

export function ProductShell({
  title,
  eyebrow = "Trainer",
  description,
  user,
  personas = [],
  selectedPersona,
  onPersonaChange,
  actions,
  children
}: ProductShellProps) {
  return (
    <main className="min-h-screen bg-[color:var(--background)]">
      <header className="border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link className="font-black text-[color:var(--accent-strong)]" href="/">
            Trainer
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-bold">
            <Link className="rounded-md px-3 py-2 text-black/70 hover:bg-black/5" href="/reports">
              Reports
            </Link>
            <Link className="rounded-md px-3 py-2 text-black/70 hover:bg-black/5" href="/workflows">
              Internal
            </Link>
            {user ? (
              <span className="rounded-full bg-[color:var(--panel)] px-3 py-2 text-black/65">
                {user.displayName || user.email}
              </span>
            ) : (
              <Link className="rounded-md bg-[color:var(--accent-strong)] px-3 py-2 text-white" href="/signin">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--accent)]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black text-[color:var(--accent-strong)] sm:text-4xl">{title}</h1>
              {description ? <p className="mt-3 max-w-3xl leading-7 text-black/70">{description}</p> : null}
            </div>
            {personas.length > 1 ? (
              <label className="grid min-w-56 gap-2 text-sm font-bold">
                Persona
                <select
                  className="rounded-md border border-black/20 bg-white px-3 py-2 font-normal"
                  onChange={(event) => onPersonaChange?.(event.target.value as PersonaKind)}
                  value={selectedPersona}
                >
                  {personas.map((persona) => (
                    <option key={persona.kind} value={persona.kind}>
                      {persona.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {actions}
          </div>
        </section>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export function StatusCard({ eyebrow, value, label, tone = "neutral" }: StatusCardProps) {
  return (
    <article className={`rounded-lg border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{eyebrow}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {label ? <p className="mt-1 text-sm opacity-75">{label}</p> : null}
    </article>
  );
}

export function ActionCard({ eyebrow, title, description, href, cta = "Open", priority }: ActionCardProps) {
  return (
    <Link className="group rounded-lg border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" href={href}>
      <div className="flex items-start justify-between gap-3">
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--accent)]">{eyebrow}</p> : null}
        {priority ? (
          <span className="rounded-full bg-[color:var(--panel)] px-2 py-1 text-xs font-black text-black/60">P{priority}</span>
        ) : null}
      </div>
      <h2 className="mt-3 text-xl font-black text-[color:var(--accent-strong)]">{title}</h2>
      <p className="mt-2 leading-7 text-black/70">{description}</p>
      <p className="mt-4 font-bold text-[color:var(--accent-strong)]">{cta}</p>
    </Link>
  );
}

export function AlertBanner({
  children,
  tone = "info"
}: {
  children: ReactNode;
  tone?: "good" | "warning" | "danger" | "info" | "neutral";
}) {
  return <div className={`rounded-lg border p-4 font-bold ${toneClasses[tone]}`}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-dashed border-black/20 bg-white p-6 text-center shadow-sm">
      <h2 className="text-xl font-black text-[color:var(--accent-strong)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl leading-7 text-black/65">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
