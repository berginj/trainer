import { ApiForm } from "../../_components/api-form";
import { WorkflowPage } from "../../_components/workflow-page";

export default function OrgSetupPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/orgs", "POST /api/seasons", "POST /api/guardians"]}
      doneItems={[
        "Organization, season, and initial staff roles are created.",
        "Consent defaults and privacy gates are visible before athlete data collection.",
        "Audit events are written for setup and role-sensitive changes."
      ]}
      eyebrow="Admin workflow"
      primaryItems={[
        "Create the organization with timezone and feature flags.",
        "Create the active season and initial teams.",
        "Invite org admins, coaches, evaluators, and guardians through Entra External ID.",
        "Configure consent copy version and child-data collection gates."
      ]}
      summary="The organization setup workflow creates the tenant boundary and the operating season before any player data is collected."
      title="Organization setup"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Creates the tenant boundary for teams, players, users, alerts, and reports."
          endpoint="/api/orgs"
          fields={[
            { name: "name", label: "Organization name", required: true, placeholder: "Northside Youth Sports" },
            { name: "timezone", label: "Timezone", required: true, defaultValue: "America/New_York" }
          ]}
          title="Create organization"
        />
        <ApiForm
          description="Creates a dated operating season inside an organization."
          endpoint="/api/seasons"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "name", label: "Season name", required: true, placeholder: "Spring 2026" },
            { name: "startDate", label: "Start date", type: "date", required: true },
            { name: "endDate", label: "End date", type: "date", required: true }
          ]}
          title="Create season"
        />
      </div>
    </WorkflowPage>
  );
}
