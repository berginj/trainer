import { ApiForm } from "../_components/api-form";
import { ApiGetViewer } from "../_components/api-get-viewer";
import { WorkflowPage } from "../_components/workflow-page";

export default function GameChangerImportPage() {
  return (
    <WorkflowPage
      apiRoutes={[
        "POST /api/integrations/gamechanger/stats/preview",
        "POST /api/integrations/gamechanger/stats/import",
        "GET /api/integrations/gamechanger/stats/import",
        "POST /api/integrations/gamechanger/stat-lines/{id}/match"
      ]}
      doneItems={[
        "CSV imports stay on official GameChanger export paths.",
        "Preview detects player, jersey, metric columns, rejected rows, and duplicate keys before import.",
        "Accepted imports store immutable raw stats separately from training measurements.",
        "Staff confirms any ambiguous player match before stats affect reports or workload."
      ]}
      eyebrow="GameChanger"
      primaryItems={[
        "Connect team schedule through Google Calendar for events.",
        "Paste one-game filtered CSV exports after games when possible.",
        "Use weekly season-total CSV exports only as a fallback delta source.",
        "Review recommended and unmatched stat rows before downstream workload/report derivation."
      ]}
      summary="Import GameChanger baseball, softball, and basketball stats exports without scraping or storing GameChanger credentials."
      title="GameChanger stats import"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Parses a pasted GameChanger stats CSV for one internal team and returns normalized stat lines plus player-match recommendations."
          endpoint="/api/integrations/gamechanger/stats/preview"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "teamId", label: "Team ID", required: true },
            {
              name: "sport",
              label: "Sport",
              type: "select",
              options: ["baseball", "softball", "basketball"],
              required: true
            },
            {
              name: "importScope",
              label: "Import scope",
              type: "select",
              options: ["game_filtered", "season_totals"],
              required: true,
              defaultValue: "game_filtered"
            },
            { name: "gameDate", label: "Game date", type: "date" },
            { name: "sourceName", label: "Source name", placeholder: "optional" },
            { name: "originalFileName", label: "Original file name", placeholder: "optional" },
            {
              name: "csv",
              label: "GameChanger CSV",
              type: "textarea",
              required: true,
              placeholder: "Player,#,FGM,FGA,3PM,3PA,PTS"
            }
          ]}
          title="Preview stats CSV"
        />
        <ApiForm
          description="Creates an immutable import batch with raw stat lines, match recommendations, rejected row counts, and source metadata."
          endpoint="/api/integrations/gamechanger/stats/import"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "teamId", label: "Team ID", required: true },
            {
              name: "sport",
              label: "Sport",
              type: "select",
              options: ["baseball", "softball", "basketball"],
              required: true
            },
            {
              name: "importScope",
              label: "Import scope",
              type: "select",
              options: ["game_filtered", "season_totals"],
              required: true,
              defaultValue: "game_filtered"
            },
            { name: "gameDate", label: "Game date", type: "date" },
            { name: "sourceName", label: "Source name", placeholder: "optional" },
            { name: "originalFileName", label: "Original file name", placeholder: "optional" },
            { name: "importedByUserId", label: "Imported by user ID", placeholder: "optional" },
            {
              name: "csv",
              label: "GameChanger CSV",
              type: "textarea",
              required: true,
              placeholder: "Player,#,AB,H,RBI,IP,Pitches"
            }
          ]}
          title="Import stats CSV"
        />
        <ApiGetViewer
          description="Loads recent persisted GameChanger import batches with their stat lines and latest match state."
          endpointTemplate="/api/integrations/gamechanger/stats/import?organizationId={id}"
          idLabel="Organization ID"
          idPlaceholder="org_..."
          title="Load imports"
        />
        <ApiForm
          description="Confirms a stat-line-to-player match or ignores a row."
          endpoint="/api/integrations/gamechanger/stat-lines/{id}/match"
          fields={[
            { name: "id", label: "Stat line ID", required: true, omitFromPayload: true },
            { name: "playerId", label: "Player ID", placeholder: "required for matched status" },
            { name: "status", label: "Status", type: "select", options: ["matched", "ignored"], required: true },
            { name: "actorUserId", label: "Actor user ID", placeholder: "optional" }
          ]}
          title="Resolve stat line"
        />
      </div>
    </WorkflowPage>
  );
}
