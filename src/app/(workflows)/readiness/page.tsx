import { ApiForm } from "../_components/api-form";
import { WorkflowPage } from "../_components/workflow-page";

export default function ReadinessPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/readiness-checks", "POST /api/alerts/evaluate"]}
      doneItems={[
        "Pain requires body-part detail.",
        "Pain flags produce alerts and safe next actions.",
        "Consent gates are enforced before youth health data collection."
      ]}
      eyebrow="Daily workflow"
      primaryItems={[
        "Capture sleep, soreness, energy, mood, pain status, body parts, and notes.",
        "Generate pain and readiness alerts from deterministic rules.",
        "Show guardian/coach follow-up where needed.",
        "Keep the check-in under one minute."
      ]}
      summary="Readiness is the highest-frequency safety input and must stay simple, consented, and actionable."
      title="Readiness check"
    >
      <ApiForm
        description="Submits a daily readiness check. Pain requires a body-part value."
        endpoint="/api/readiness-checks"
        fields={[
          { name: "organizationId", label: "Organization ID", required: true },
          { name: "playerId", label: "Player ID", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "sleepHours", label: "Sleep hours", type: "number" },
          { name: "sorenessScore", label: "Soreness score", type: "number" },
          { name: "energyScore", label: "Energy score", type: "number" },
          { name: "painAny", label: "Pain reported", type: "checkbox" },
          { name: "painBodyParts", label: "Pain body part", placeholder: "throwing arm", array: true }
        ]}
        title="Submit readiness"
      />
    </WorkflowPage>
  );
}
