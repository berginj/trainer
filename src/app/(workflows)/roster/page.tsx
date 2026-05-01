import { ApiForm } from "../_components/api-form";
import { WorkflowPage } from "../_components/workflow-page";

export default function RosterPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/players", "POST /api/guardians"]}
      doneItems={[
        "Every player has organization scope and active status.",
        "Guardian links and consent state are clear.",
        "Missing baseline and missing consent states are actionable."
      ]}
      eyebrow="Operations workflow"
      primaryItems={[
        "Create player profiles with date of birth, sports, positions, handedness, and status.",
        "Link guardians and display consent state.",
        "Assign players to teams and seasons.",
        "Surface missing baseline, missing guardian, and missing consent tasks."
      ]}
      summary="Roster management keeps athlete identity, guardian relationships, consent, and team assignment explicit."
      title="Roster"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Creates a player profile scoped to one organization."
          endpoint="/api/players"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "preferredName", label: "Preferred name", required: true },
            { name: "dateOfBirth", label: "Date of birth", type: "date", required: true },
            { name: "sexAtBirth", label: "Sex at birth", placeholder: "optional" },
            { name: "dominantHand", label: "Dominant hand", placeholder: "optional" },
            { name: "dominantFoot", label: "Dominant foot", placeholder: "optional" }
          ]}
          title="Create player"
        />
        <ApiForm
          description="Creates or updates a guardian and optionally links them to a player."
          endpoint="/api/guardians"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "externalIdentityId", label: "External identity ID", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "displayName", label: "Display name", required: true },
            { name: "playerId", label: "Player ID", placeholder: "optional" },
            { name: "relationship", label: "Relationship", defaultValue: "guardian" }
          ]}
          title="Create or link guardian"
        />
        <ApiForm
          description="Assigns a player to a team roster."
          endpoint="/api/team-players"
          fields={[
            { name: "teamId", label: "Team ID", required: true },
            { name: "playerId", label: "Player ID", required: true }
          ]}
          title="Assign player to team"
        />
      </div>
    </WorkflowPage>
  );
}
