import { ApiForm } from "../_components/api-form";
import { WorkflowPage } from "../_components/workflow-page";

export default function ScheduleChangesPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/trainer-appointments/{id}/change-notices"]}
      doneItems={[
        "Appointment status records cancellation or needs-reschedule state.",
        "The email-first notification payload includes original time, reason, custom message, and make-up options.",
        "Delivery is prepared and auditable until an email provider is configured."
      ]}
      eyebrow="Weather workflow"
      primaryItems={[
        "Select affected upcoming appointments during weather or unforeseen changes.",
        "Mark each appointment cancelled or needing reschedule.",
        "Prepare athlete/client email notifications through the existing server workflow.",
        "Offer one-off make-up availability when recurring trainer availability does not exist yet."
      ]}
      summary="Schedule changes capture the business event and prepare email content without adding SMS, push, or a premature availability engine."
      title="Schedule Changes"
    >
      <ApiForm
        description="Creates a cancellation/reschedule notice and prepares an email payload for the affected athlete/client."
        endpoint="/api/trainer-appointments/{id}/change-notices"
        fields={[
          { name: "id", label: "Appointment ID", required: true, omitFromPayload: true },
          {
            name: "changeType",
            label: "Change type",
            type: "select",
            options: ["cancelled", "needs_reschedule"],
            required: true
          },
          { name: "reason", label: "Reason", required: true },
          { name: "customMessage", label: "Custom message", type: "textarea", placeholder: "optional" },
          {
            name: "oneOffAvailability",
            label: "One-off availability JSON",
            type: "textarea",
            json: true,
            defaultValue:
              '[{"startTime":"2026-05-05T15:00:00Z","endTime":"2026-05-05T16:00:00Z","label":"Make-up option 1"}]'
          },
          { name: "actorUserId", label: "Actor user ID", placeholder: "optional" }
        ]}
        title="Prepare change notice"
      />
    </WorkflowPage>
  );
}

