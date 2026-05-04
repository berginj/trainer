"use client";

import { useState } from "react";

type ApiGetViewerProps = {
  title: string;
  description: string;
  endpointTemplate: string;
  idLabel: string;
  idPlaceholder: string;
  extraFields?: Array<{
    name: string;
    label: string;
    placeholder?: string;
  }>;
};

export function ApiGetViewer({
  title,
  description,
  endpointTemplate,
  idLabel,
  idPlaceholder,
  extraFields = []
}: ApiGetViewerProps) {
  const [id, setId] = useState("");
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("Not loaded.");
  const [isLoading, setIsLoading] = useState(false);

  async function load() {
    setIsLoading(true);

    try {
      const resolvedEndpoint = extraFields.reduce(
        (path, field) => path.replaceAll(`{${field.name}}`, encodeURIComponent(extraValues[field.name] ?? "")),
        endpointTemplate.replace("{id}", encodeURIComponent(id))
      );
      const response = await fetch(resolvedEndpoint);
      const body = (await response.json()) as unknown;
      setResult(JSON.stringify(body, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[color:var(--accent)]/15 bg-white/75 p-6 shadow-lg shadow-black/5">
      <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">{title}</h2>
      <p className="mt-2 leading-7">{description}</p>
      <label className="mt-5 flex flex-col gap-2 font-bold">
        {idLabel}
        <input
          className="rounded-xl border border-[color:var(--accent)]/20 bg-white p-3 font-normal"
          onChange={(event) => setId(event.target.value)}
          placeholder={idPlaceholder}
          value={id}
        />
      </label>
      {extraFields.map((field) => (
        <label className="mt-4 flex flex-col gap-2 font-bold" key={field.name}>
          {field.label}
          <input
            className="rounded-xl border border-[color:var(--accent)]/20 bg-white p-3 font-normal"
            onChange={(event) => setExtraValues((current) => ({ ...current, [field.name]: event.target.value }))}
            placeholder={field.placeholder}
            value={extraValues[field.name] ?? ""}
          />
        </label>
      ))}
      <button
        className="mt-5 rounded-full bg-[color:var(--accent-strong)] px-5 py-3 font-bold text-white disabled:opacity-60"
        disabled={isLoading || !id}
        onClick={load}
        type="button"
      >
        {isLoading ? "Loading..." : "Load"}
      </button>
      <pre className="mt-5 max-h-96 overflow-auto rounded-2xl bg-[color:var(--accent-strong)] p-4 text-sm text-white">
        {result}
      </pre>
    </section>
  );
}
