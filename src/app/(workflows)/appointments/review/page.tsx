import { ApiForm } from "../../_components/api-form";
import { ApiGetViewer } from "../../_components/api-get-viewer";
import { WorkflowPage } from "../../_components/workflow-page";

export default function AppointmentReviewPage() {
  return (
    <WorkflowPage
      apiRoutes={[
        "GET /api/trainer-appointments",
        "POST /api/trainer-appointments/{id}/match",
        "POST /api/trainer-appointments/{id}/create-athlete"
      ]}
      doneItems={[
        "High-confidence deterministic matches can be confirmed or overridden.",
        "Ambiguous recommendations stay trainer-confirmed, not automatic.",
        "Unmatched appointments can create a new athlete explicitly."
      ]}
      eyebrow="Trainer review"
      primaryItems={[
        "Review imported appointment date/time, event title, status, and match reason.",
        "Confirm the recommended athlete or choose a different existing athlete.",
        "Create a new athlete only after trainer confirmation.",
        "Ignore appointments that should not enter the product workflow."
      ]}
      summary="The review queue converts imported Google events into trusted athlete-linked appointments while keeping ambiguous decisions human-controlled."
      title="Appointment Review"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiGetViewer
          description="Loads upcoming trainer appointments with latest match recommendations and change notices."
          endpointTemplate="/api/trainer-appointments?organizationId={id}&trainerUserId={trainerUserId}"
          extraFields={[{ name: "trainerUserId", label: "Trainer user ID", placeholder: "user_..." }]}
          idLabel="Organization ID"
          idPlaceholder="org_..."
          title="Load appointment queue"
        />
        <ApiForm
          description="Confirms an athlete match or ignores an appointment."
          endpoint="/api/trainer-appointments/{id}/match"
          fields={[
            { name: "id", label: "Appointment ID", required: true, omitFromPayload: true },
            { name: "playerId", label: "Player ID", placeholder: "required for matched status" },
            { name: "status", label: "Status", type: "select", options: ["matched", "ignored"], required: true },
            { name: "actorUserId", label: "Actor user ID", placeholder: "optional" }
          ]}
          title="Resolve appointment"
        />
        <ApiForm
          description="Creates a player from an unmatched appointment and links it immediately."
          endpoint="/api/trainer-appointments/{id}/create-athlete"
          fields={[
            { name: "id", label: "Appointment ID", required: true, omitFromPayload: true },
            { name: "preferredName", label: "Preferred name", required: true },
            { name: "dateOfBirth", label: "Date of birth", type: "date", required: true },
            { name: "sexAtBirth", label: "Sex at birth", placeholder: "optional" },
            { name: "actorUserId", label: "Actor user ID", placeholder: "optional" }
          ]}
          title="Create athlete from appointment"
        />
      </div>
    </WorkflowPage>
  );
}
