"use client";

import { useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "date" | "number" | "checkbox" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  array?: boolean;
  omitFromPayload?: boolean;
};

type ApiFormProps = {
  title: string;
  description: string;
  endpoint: string;
  fields: Field[];
};

function coerceValue(value: FormDataEntryValue, field: Field) {
  if (!field.required && value === "") {
    return undefined;
  }

  if (field.array) {
    return value.toString() ? [value.toString()] : [];
  }

  if (field.type === "number") {
    return value === "" ? undefined : Number(value);
  }

  if (field.type === "checkbox") {
    return value === "on";
  }

  return value.toString();
}

export function ApiForm({ title, description, endpoint, fields }: ApiFormProps) {
  const [result, setResult] = useState<string>("Not submitted.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setIsSubmitting(true);
    const rawValues = Object.fromEntries(formData.entries());
    const payload = Object.fromEntries(
      fields
        .filter((field) => !field.omitFromPayload)
        .map((field) => [field.name, coerceValue(rawValues[field.name] ?? "", field)])
    );
    const resolvedEndpoint = fields.reduce(
      (path, field) => path.replaceAll(`{${field.name}}`, rawValues[field.name]?.toString() ?? ""),
      endpoint
    );

    try {
      const response = await fetch(resolvedEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as unknown;
      setResult(JSON.stringify(body, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      action={submit}
      className="rounded-[1.5rem] border border-[color:var(--accent)]/15 bg-white/75 p-6 shadow-lg shadow-black/5"
    >
      <h2 className="text-2xl font-black text-[color:var(--accent-strong)]">{title}</h2>
      <p className="mt-2 leading-7">{description}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label className="flex flex-col gap-2 font-bold" key={field.name}>
            {field.label}
            {field.type === "textarea" ? (
              <textarea
                className="min-h-24 rounded-xl border border-[color:var(--accent)]/20 bg-white p-3 font-normal"
                defaultValue={field.defaultValue}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <select
                className="rounded-xl border border-[color:var(--accent)]/20 bg-white p-3 font-normal"
                defaultValue={field.defaultValue}
                name={field.name}
                required={field.required}
              >
                <option value="">Select</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="rounded-xl border border-[color:var(--accent)]/20 bg-white p-3 font-normal"
                defaultValue={field.defaultValue}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                type={field.type ?? "text"}
              />
            )}
          </label>
        ))}
      </div>
      <button
        className="mt-5 rounded-full bg-[color:var(--accent-strong)] px-5 py-3 font-bold text-white disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
      <pre className="mt-5 max-h-72 overflow-auto rounded-2xl bg-[color:var(--accent-strong)] p-4 text-sm text-white">
        {result}
      </pre>
    </form>
  );
}
