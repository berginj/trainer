import { ApiGetViewer } from "../../_components/api-get-viewer";
import { WorkflowPage } from "../../_components/workflow-page";

export default function TeamDashboardPage() {
  return (
    <WorkflowPage
      apiRoutes={["GET /api/teams/[id]/dashboard"]}
      doneItems={[
        "Dashboard payload identifies roster count and modify count.",
        "Players with open alerts are marked modify_or_hold.",
        "Missing team returns the standard API error shape."
      ]}
      eyebrow="Dashboard"
      primaryItems={[
        "Load team dashboard payload by team ID.",
        "Verify coach-facing status answers who should be modified today.",
        "Use this viewer until authenticated coach dashboard routing is implemented."
      ]}
      summary="Team dashboard viewer exercises the current coach/team dashboard API contract."
      title="Team dashboard"
    >
      <ApiGetViewer
        description="Loads the team dashboard JSON from the API."
        endpointTemplate="/api/teams/{id}/dashboard"
        idLabel="Team ID"
        idPlaceholder="team cuid"
        title="Load team dashboard"
      />
    </WorkflowPage>
  );
}
