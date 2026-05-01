import { ApiForm } from "../../_components/api-form";
import { WorkflowPage } from "../../_components/workflow-page";

export default function BaselineEvaluationPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/evaluations", "POST /api/measurements", "GET /api/metric-definitions"]}
      doneItems={[
        "Measurements store protocol version and context.",
        "Metrics respect visibility, benchmark policy, and ranking guards.",
        "Evaluator entries are audit logged."
      ]}
      eyebrow="Evaluator workflow"
      primaryItems={[
        "Create baseline evaluation for the player.",
        "Capture launch metrics from the metric-definition inventory.",
        "Store protocol version, evaluator, context, and value type.",
        "Mark weak benchmarks as local-only or within-player trend."
      ]}
      summary="Baseline evaluation establishes the first trustworthy measurement set using standardized metric metadata."
      title="Baseline evaluation"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Creates an evaluation container for baseline or monthly testing."
          endpoint="/api/evaluations"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "playerId", label: "Player ID", required: true },
            { name: "evaluatorUserId", label: "Evaluator user ID", placeholder: "optional" },
            { name: "evaluationType", label: "Evaluation type", required: true, defaultValue: "baseline" },
            { name: "date", label: "Date", type: "date", required: true },
            { name: "notes", label: "Notes", type: "textarea" }
          ]}
          title="Create evaluation"
        />
        <ApiForm
          description="Captures one measurement value tied to a metric definition."
          endpoint="/api/measurements"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "playerId", label: "Player ID", required: true },
            { name: "evaluationId", label: "Evaluation ID", placeholder: "optional" },
            { name: "metricDefinitionId", label: "Metric definition ID", required: true },
            { name: "valueNumber", label: "Numeric value", type: "number" },
            { name: "protocolVersion", label: "Protocol version", required: true, defaultValue: "launch_v1" }
          ]}
          title="Create measurement"
        />
      </div>
    </WorkflowPage>
  );
}
