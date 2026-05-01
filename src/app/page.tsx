import Link from "next/link";
import { doneChecklist, workflowCards } from "@/lib/workflow-content";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10">
      <section className="rounded-[2rem] border border-[color:var(--accent-strong)]/15 bg-[color:var(--panel)]/85 p-8 shadow-2xl shadow-black/10 backdrop-blur">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[color:var(--accent)]">
          MVP cockpit
        </p>
        <h1 className="max-w-3xl text-5xl font-black leading-tight text-[color:var(--accent-strong)] md:text-7xl">
          Build the youth training workflow from setup to monthly review.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8">
          The application now has contracts for setup, readiness, workload, routines,
          reports, safety alerts, audit events, and Azure-ready deployment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[color:var(--accent-strong)] px-5 py-3 font-bold text-white"
            href="/api/health"
          >
            Health endpoint
          </Link>
          <a
            className="rounded-full border border-[color:var(--accent-strong)]/25 px-5 py-3 font-bold text-[color:var(--accent-strong)]"
            href="/BUILD_DEPLOYMENT_PLAN.md"
          >
            Build plan
          </a>
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {workflowCards.map((card) => (
          <Link
            className="group rounded-[1.5rem] border border-[color:var(--accent)]/15 bg-white/70 p-5 shadow-lg shadow-black/5 transition hover:-translate-y-1 hover:bg-white"
            href={card.href}
            key={card.href}
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--warning)]">{card.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-black text-[color:var(--accent-strong)]">{card.title}</h2>
            <p className="mt-3 leading-7">{card.summary}</p>
            <p className="mt-5 font-bold text-[color:var(--accent)]">Open workflow</p>
          </Link>
        ))}
      </section>
      <section className="mt-8 rounded-[2rem] bg-[color:var(--accent-strong)] p-8 text-white">
        <h2 className="text-3xl font-black">Global Done Criteria</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {doneChecklist.map((item) => (
            <div className="rounded-2xl bg-white/10 p-4" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
