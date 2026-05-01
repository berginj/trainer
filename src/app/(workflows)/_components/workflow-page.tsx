import Link from "next/link";
import type { ReactNode } from "react";

type WorkflowPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  primaryItems: string[];
  doneItems: string[];
  apiRoutes?: string[];
  children?: ReactNode;
};

export function WorkflowPage({
  eyebrow,
  title,
  summary,
  primaryItems,
  doneItems,
  apiRoutes = [],
  children
}: WorkflowPageProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <Link className="text-sm font-bold text-[color:var(--accent)]" href="/">
        Back to cockpit
      </Link>
      <section className="mt-6 rounded-[2rem] border border-[color:var(--accent-strong)]/15 bg-[color:var(--panel)]/90 p-8 shadow-xl shadow-black/10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[color:var(--accent)]">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black text-[color:var(--accent-strong)] md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8">{summary}</p>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] bg-white/70 p-6 shadow-lg shadow-black/5">
          <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Required Work</h2>
          <ul className="mt-4 space-y-3">
            {primaryItems.map((item) => (
              <li className="rounded-2xl border border-[color:var(--accent)]/15 bg-[color:var(--panel)] p-4" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <aside className="rounded-[1.5rem] bg-[color:var(--accent-strong)] p-6 text-white shadow-lg shadow-black/10">
          <h2 className="text-2xl font-black">Done Means</h2>
          <ul className="mt-4 space-y-3">
            {doneItems.map((item) => (
              <li className="rounded-2xl bg-white/10 p-4" key={item}>
                {item}
              </li>
            ))}
          </ul>
          {apiRoutes.length > 0 ? (
            <>
              <h3 className="mt-6 text-lg font-black">API Contracts</h3>
              <ul className="mt-3 space-y-2">
                {apiRoutes.map((route) => (
                  <li className="font-mono text-sm text-white/90" key={route}>
                    {route}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>
      </section>
      {children ? <section className="mt-6">{children}</section> : null}
    </main>
  );
}
