import { ApiForm } from "../../_components/api-form";
import { WorkflowPage } from "../../_components/workflow-page";

export default function PlayerProfilePage() {
  return (
    <WorkflowPage
      apiRoutes={["GET /api/players/[id]/dashboard", "POST /api/reports"]}
      doneItems={[
        "Player view shows personal trends, not public ranks.",
        "Open alerts include reason and safe next action.",
        "Reports are generated from immutable snapshots."
      ]}
      eyebrow="Development workflow"
      primaryItems={[
        "Show current goals, readiness, assigned routines, alerts, and report history.",
        "Display benchmark confidence labels where comparisons are allowed.",
        "Hide prohibited rankings and sensitive public comparisons.",
        "Give parent- and player-safe developmental language."
      ]}
      summary="The player profile is the central development view for trends, routines, alerts, and reports."
      title="Player profile"
    >
      <ApiForm
        description="Creates a development goal for a player."
        endpoint="/api/goals"
        fields={[
          { name: "organizationId", label: "Organization ID", required: true },
          { name: "playerId", label: "Player ID", required: true },
          { name: "metricDefinitionId", label: "Metric definition ID", placeholder: "optional" },
          { name: "targetType", label: "Target type", required: true, placeholder: "habit, metric, routine" },
          { name: "targetValue", label: "Target value", placeholder: "optional" },
          { name: "dueDate", label: "Due date", type: "date" }
        ]}
        title="Create goal"
      />
    </WorkflowPage>
  );
}
