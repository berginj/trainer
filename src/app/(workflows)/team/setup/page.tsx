import { ApiForm } from "../../_components/api-form";
import { WorkflowPage } from "../../_components/workflow-page";

export default function TeamSetupPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/teams", "GET /api/teams/[id]/dashboard"]}
      doneItems={[
        "Team belongs to one organization and season.",
        "Coach and assistant access is scoped to assigned teams.",
        "Dashboard can answer who should be modified today."
      ]}
      eyebrow="Coach workflow"
      primaryItems={[
        "Select sport, season, level, and optional sex category.",
        "Attach coaches, assistants, and evaluators.",
        "Assign roster and review missing guardian/consent links.",
        "Set monthly evaluation cadence and workload tracking expectations."
      ]}
      summary="Team setup turns the organization plan into a working roster with scoped staff access and sport-specific tracking."
      title="Team setup"
    >
      <ApiForm
        description="Creates a sport-specific team for one season."
        endpoint="/api/teams"
        fields={[
          { name: "organizationId", label: "Organization ID", required: true },
          { name: "seasonId", label: "Season ID", required: true },
          { name: "name", label: "Team name", required: true, placeholder: "12U Baseball" },
          { name: "sport", label: "Sport", type: "select", required: true, options: ["basketball", "baseball", "softball"] },
          { name: "sexCategory", label: "Sex category", placeholder: "optional" },
          { name: "level", label: "Level", required: true, placeholder: "12U" }
        ]}
        title="Create team"
      />
    </WorkflowPage>
  );
}
