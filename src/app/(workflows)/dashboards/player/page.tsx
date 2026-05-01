import { ApiGetViewer } from "../../_components/api-get-viewer";
import { WorkflowPage } from "../../_components/workflow-page";

export default function PlayerDashboardPage() {
  return (
    <WorkflowPage
      apiRoutes={["GET /api/players/[id]/dashboard"]}
      doneItems={[
        "Dashboard payload shows status, readiness, open alerts, routines, and next message.",
        "Player view remains rank-free and avoids diagnosis language.",
        "Missing player returns the standard API error shape."
      ]}
      eyebrow="Dashboard"
      primaryItems={[
        "Load player dashboard payload by player ID.",
        "Verify alerts include reason and next safe action.",
        "Use this viewer until authenticated role-aware dashboard routing is implemented."
      ]}
      summary="Player dashboard viewer exercises the current player dashboard API contract."
      title="Player dashboard"
    >
      <ApiGetViewer
        description="Loads the player dashboard JSON from the API."
        endpointTemplate="/api/players/{id}/dashboard"
        idLabel="Player ID"
        idPlaceholder="player cuid"
        title="Load player dashboard"
      />
    </WorkflowPage>
  );
}
