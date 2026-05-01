import { ApiGetViewer } from "../../_components/api-get-viewer";
import { WorkflowPage } from "../../_components/workflow-page";

export default function ReportViewPage() {
  return (
    <WorkflowPage
      apiRoutes={["GET /api/reports/[id]"]}
      doneItems={[
        "Report payload is loaded by immutable report ID.",
        "Snapshot content is inspectable before PDF/blob export exists.",
        "Missing report returns the standard API error shape."
      ]}
      eyebrow="Report view"
      primaryItems={[
        "Load report snapshot JSON by report ID.",
        "Use browser print while Azure Blob/PDF generation remains on the backlog.",
        "Verify report language avoids diagnosis and unsupported rankings."
      ]}
      summary="Printable report viewing exposes immutable report snapshots before full PDF artifact generation is implemented."
      title="Report viewer"
    >
      <ApiGetViewer
        description="Loads an immutable report snapshot from the API."
        endpointTemplate="/api/reports/{id}"
        idLabel="Report ID"
        idPlaceholder="report cuid"
        title="Load report"
      />
    </WorkflowPage>
  );
}
