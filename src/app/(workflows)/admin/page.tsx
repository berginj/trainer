import { ApiForm } from "../_components/api-form";
import { WorkflowPage } from "../_components/workflow-page";

export default function AdminPage() {
  return (
    <WorkflowPage
      apiRoutes={["GET /api/metric-definitions", "POST /api/alerts/recompute (planned)"]}
      doneItems={[
        "Metric definitions control visibility, benchmark behavior, and ranking eligibility.",
        "Audit events are searchable for sensitive changes.",
        "Admin views show missing consent, alert coverage, and benchmark gaps."
      ]}
      eyebrow="Governance workflow"
      primaryItems={[
        "Manage metric definitions, benchmark policy, confidence, and visibility.",
        "Review alert counts, audit events, feature flags, and consent gaps.",
        "Prepare Azure App Configuration feature flags for rollout.",
        "Keep athlete analytics separate from product analytics."
      ]}
      summary="Admin controls keep safety, privacy, benchmark policy, and operational readiness visible."
      title="Admin controls"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Records guardian consent state for a player and consent type."
          endpoint="/api/consents"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "playerId", label: "Player ID", required: true },
            { name: "guardianUserId", label: "Guardian user ID", required: true },
            { name: "consentType", label: "Consent type", type: "select", required: true, options: ["readiness", "workload", "reports", "media"] },
            { name: "status", label: "Status", type: "select", required: true, options: ["granted", "revoked", "pending"] },
            { name: "version", label: "Consent copy version", required: true, defaultValue: "v1" }
          ]}
          title="Record consent"
        />
        <ApiForm
          description="Imports a benchmark with explicit confidence and source citation."
          endpoint="/api/benchmarks/import"
          fields={[
            { name: "organizationId", label: "Organization ID", placeholder: "optional for global" },
            { name: "metricDefinitionId", label: "Metric definition ID", required: true },
            { name: "sourceTitle", label: "Source title", required: true },
            { name: "sourceCitation", label: "Source citation", required: true },
            { name: "confidence", label: "Confidence", type: "select", required: true, options: ["strong", "moderate", "consensus", "weak"] },
            { name: "midBound", label: "Mid bound", type: "number" }
          ]}
          title="Import benchmark"
        />
        <ApiForm
          description="Acknowledges or resolves an open alert."
          endpoint="/api/alerts/{alertId}"
          fields={[
            { name: "alertId", label: "Alert ID", required: true, omitFromPayload: true },
            { name: "status", label: "Status", type: "select", required: true, options: ["acknowledged", "resolved"] },
            { name: "actorUserId", label: "Actor user ID", placeholder: "optional" }
          ]}
          title="Alert status contract"
        />
      </div>
    </WorkflowPage>
  );
}
