import Link from "next/link";
import { doneChecklist, workflowCards } from "@/lib/workflow-content";

export default function WorkflowsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10">
      <section className="rounded-lg border border-[color:var(--accent-strong)]/15 bg-[color:var(--panel)] p-8 shadow-sm">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">
          Internal workflow cockpit
        </p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-[color:var(--accent-strong)] md:text-6xl">
          API forms and setup utilities for implementation work.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8">
          Product users should start at the role-aware home. This cockpit keeps raw contract forms and workflow
          utilities available for development, setup, and operations.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white" href="/">
            Product home
          </Link>
          <Link className="rounded-md border border-[color:var(--accent-strong)]/25 px-4 py-2 font-bold text-[color:var(--accent-strong)]" href="/api/health">
            Health endpoint
          </Link>
          <a
            className="rounded-md border border-[color:var(--accent-strong)]/25 px-4 py-2 font-bold text-[color:var(--accent-strong)]"
            href="/BUILD_DEPLOYMENT_PLAN.md"
          >
            Build plan
          </a>
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {workflowCards.map((card) => (
          <Link
            className="group rounded-lg border border-[color:var(--accent)]/15 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            href={card.href}
            key={card.href}
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--accent)]">{card.eyebrow}</p>
            <h2 className="mt-3 text-xl font-black text-[color:var(--accent-strong)]">{card.title}</h2>
            <p className="mt-3 leading-7 text-black/70">{card.summary}</p>
            <p className="mt-5 font-bold text-[color:var(--accent)]">Open internal workflow</p>
          </Link>
        ))}
      </section>
      <section className="mt-8 rounded-lg bg-[color:var(--accent-strong)] p-6 text-white">
        <h2 className="text-2xl font-black">Global Done Criteria</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {doneChecklist.map((item) => (
            <div className="rounded-md bg-white/10 p-4" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
