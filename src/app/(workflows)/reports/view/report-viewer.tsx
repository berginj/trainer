"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SnapshotPayload = {
  reportVersion: string;
  generatedAt: string;
  player: {
    id: string;
    preferredName: string;
  };
  developmentSnapshot: {
    readinessCheckCount: number;
    workloadEntryCount: number;
    routineCompletionCount: number;
    openAlertCount: number;
    personalBestCount: number;
    benchmarkContextCount: number;
  };
  readinessTrend: string;
  workloadSummary: string;
  currentPainFlags: string;
  coachPriorities: string[];
  homeRoutineSchedule: string[];
  parentNotes: string;
  whatChangedSinceLastMonth: string;
  benchmarkNote: string;
  nextActions: string[];
};

type ReportPayload = {
  report: {
    id: string;
    reportType: string;
    generatedAt: string;
    snapshotPayload: SnapshotPayload;
  };
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function ReportViewer() {
  const [reportId, setReportId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("reportId") ?? "";
  });
  const [report, setReport] = useState<ReportPayload["report"] | null>(null);
  const [message, setMessage] = useState("Enter a report ID or open a report from the reports page.");

  const loadReport = useCallback(async (nextReportId = reportId) => {
    if (!nextReportId) {
      setMessage("Enter a report ID.");
      return;
    }

    const response = await fetch(`/api/reports/${nextReportId}`);
    const body = (await response.json()) as ReportPayload & { message?: string };

    if (!response.ok || !body.report) {
      setReport(null);
      setMessage(body.message ?? "Could not load report.");
      return;
    }

    setReport(body.report);
    setMessage("");
  }, [reportId]);

  useEffect(() => {
    let active = true;

    async function loadInitialReport() {
      if (!reportId) {
        return;
      }

      const response = await fetch(`/api/reports/${reportId}`);
      const body = (await response.json()) as ReportPayload & { message?: string };

      if (!active) {
        return;
      }

      if (!response.ok || !body.report) {
        setReport(null);
        setMessage(body.message ?? "Could not load report.");
        return;
      }

      setReport(body.report);
      setMessage("");
    }

    void loadInitialReport();

    return () => {
      active = false;
    };
  }, [reportId]);

  const snapshot = report?.snapshotPayload;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <section className="print:hidden rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">Report viewer</p>
            <h1 className="mt-1 text-2xl font-black text-[color:var(--accent-strong)]">
              {snapshot?.player.preferredName ?? "Open a report"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
          <button className="rounded-md border border-black/15 px-4 py-2 font-bold" onClick={() => window.print()} type="button">
            Print
          </button>
          <Link className="rounded-md border border-black/15 px-4 py-2 font-bold" href="/reports">
            Back to reports
          </Link>
          </div>
        </div>
        <details className="mt-4 rounded-md bg-[color:var(--panel)] p-3">
          <summary className="cursor-pointer text-sm font-bold">Troubleshooting: load by report ID</summary>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="grid flex-1 gap-2 text-sm font-bold">
              Report ID
              <input
                className="rounded-md border border-black/20 px-3 py-2 font-normal"
                onChange={(event) => setReportId(event.target.value)}
                placeholder="report id"
                value={reportId}
              />
            </label>
            <button
              className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 font-bold text-white"
              onClick={() => loadReport()}
              type="button"
            >
              Load
            </button>
          </div>
        </details>
      </section>

      {message ? <p className="mt-5 rounded-md bg-white p-4 font-bold text-[color:var(--accent-strong)]">{message}</p> : null}

      {snapshot ? (
        <article className="mt-6 rounded-lg bg-white p-8 shadow-sm print:mt-0 print:shadow-none">
          <header className="border-b border-black/10 pb-5">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Monthly player report</p>
            <h1 className="mt-2 text-4xl font-black text-[color:var(--accent-strong)]">{snapshot.player.preferredName}</h1>
            <p className="mt-2 text-sm text-black/65">
              Generated {formatDate(snapshot.generatedAt)} · Immutable snapshot
            </p>
            <details className="mt-3 text-sm text-black/60 print:hidden">
              <summary className="cursor-pointer font-bold">Technical details</summary>
              <p className="mt-1 font-mono">{report?.id}</p>
            </details>
          </header>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md bg-[color:var(--panel)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Readiness</p>
              <p className="mt-2 text-3xl font-black">{snapshot.developmentSnapshot.readinessCheckCount}</p>
            </div>
            <div className="rounded-md bg-[color:var(--panel)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Workload</p>
              <p className="mt-2 text-3xl font-black">{snapshot.developmentSnapshot.workloadEntryCount}</p>
            </div>
            <div className="rounded-md bg-[color:var(--panel)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Routines</p>
              <p className="mt-2 text-3xl font-black">{snapshot.developmentSnapshot.routineCompletionCount}</p>
            </div>
            <div className="rounded-md bg-[color:var(--panel)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Open alerts</p>
              <p className="mt-2 text-3xl font-black">{snapshot.developmentSnapshot.openAlertCount}</p>
            </div>
          </section>

          <section className="mt-6 grid gap-5">
            <div>
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Readiness</h2>
              <p className="mt-2 leading-7">{snapshot.readinessTrend}</p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Workload</h2>
              <p className="mt-2 leading-7">{snapshot.workloadSummary}</p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Safety flags</h2>
              <p className="mt-2 leading-7">{snapshot.currentPainFlags}</p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Coach priorities</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {snapshot.coachPriorities.map((priority) => (
                  <li key={priority}>{priority}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">Next actions</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {snapshot.nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
            <p className="rounded-md bg-[color:var(--panel)] p-4 text-sm font-bold">{snapshot.benchmarkNote}</p>
          </section>
        </article>
      ) : null}
    </main>
  );
}
