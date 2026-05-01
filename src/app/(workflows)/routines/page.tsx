import { ApiForm } from "../_components/api-form";
import { WorkflowPage } from "../_components/workflow-page";

export default function RoutinesPage() {
  return (
    <WorkflowPage
      apiRoutes={["POST /api/routine-assignments", "POST /api/routine-completions"]}
      doneItems={[
        "Assignments target a player or team.",
        "Stop rules are visible before completion.",
        "Pain during completion creates an alert and suppresses unsafe progression."
      ]}
      eyebrow="Home plan workflow"
      primaryItems={[
        "Assign routine library items by sport, level, duration, and equipment.",
        "Capture completion, quality, pain during routine, RPE, and notes.",
        "Use pain and non-compliance to adjust future assignments.",
        "Keep routines short, safe, and developmentally appropriate."
      ]}
      summary="Routines translate evaluation and workload context into safe at-home action."
      title="Routines"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Assigns a routine to a player or team."
          endpoint="/api/routine-assignments"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "routineId", label: "Routine ID", required: true },
            { name: "playerId", label: "Player ID", placeholder: "optional" },
            { name: "teamId", label: "Team ID", placeholder: "optional" },
            { name: "frequency", label: "Frequency", required: true, defaultValue: "weekly" }
          ]}
          title="Assign routine"
        />
        <ApiForm
          description="Records routine completion and creates a pain alert if needed."
          endpoint="/api/routine-completions"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "assignmentId", label: "Assignment ID", required: true },
            { name: "playerId", label: "Player ID", required: true },
            { name: "date", label: "Date", type: "date", required: true },
            { name: "completed", label: "Completed", type: "checkbox" },
            { name: "painDuring", label: "Pain during routine", type: "checkbox" },
            { name: "rpe", label: "RPE", type: "number" }
        ]}
        title="Complete routine"
      />
      </div>
    </WorkflowPage>
  );
}
