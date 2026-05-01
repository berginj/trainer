import { ApiForm } from "../_components/api-form";
import { WorkflowPage } from "../_components/workflow-page";

export default function WorkloadPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/workload-entries", "POST /api/alerts/evaluate"]}
      doneItems={[
        "Baseball pitch-count rest conflicts produce red alerts.",
        "Softball consecutive-day exposure produces guidance alerts.",
        "Workload entries are audit logged."
      ]}
      eyebrow="Session workflow"
      primaryItems={[
        "Record participation, minutes, session RPE, throws, pitches, innings, and notes.",
        "Calculate baseball rest windows from date of birth and outing date.",
        "Flag softball consecutive-day exposure and pain/fatigue combinations.",
        "Compare workload to recent normal without false precision."
      ]}
      summary="Workload entry gives coaches the context needed to modify practice safely."
      title="Workload entry"
    >
      <ApiForm
        description="Records a session workload entry. Baseball/softball alert persistence is tracked in the backlog."
        endpoint="/api/workload-entries"
        fields={[
          { name: "organizationId", label: "Organization ID", required: true },
          { name: "playerId", label: "Player ID", required: true },
          { name: "teamId", label: "Team ID", placeholder: "optional" },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "sport", label: "Sport", type: "select", required: true, options: ["basketball", "baseball", "softball"] },
          { name: "sessionType", label: "Session type", required: true, placeholder: "practice" },
          { name: "minutes", label: "Minutes", type: "number" },
          { name: "sessionRpe", label: "Session RPE", type: "number" },
          { name: "pitches", label: "Pitches", type: "number" },
          { name: "participationStatus", label: "Participation status", required: true, defaultValue: "attended" }
        ]}
        title="Submit workload"
      />
    </WorkflowPage>
  );
}
