import { ApiForm } from "../../_components/api-form";
import { ApiGetViewer } from "../../_components/api-get-viewer";
import { WorkflowPage } from "../../_components/workflow-page";

export default function VenmoPaymentsPage() {
  return (
    <WorkflowPage
      apiRoutes={[
        "POST /api/payments/venmo/import",
        "GET /api/payments/transactions",
        "POST /api/payments/transactions/{id}/match"
      ]}
      doneItems={[
        "Only trainer-provided CSV/log imports are supported; no scraping or unofficial Venmo API access.",
        "Malformed rows are rejected without logging raw sensitive files.",
        "Ambiguous payment matches remain trainer-confirmed."
      ]}
      eyebrow="Bookkeeping"
      primaryItems={[
        "Upload or paste a Venmo CSV export for import.",
        "Normalize transaction date, amount, direction, counterparty, note, and external ID.",
        "Recommend athlete matches using contact/name/note signals.",
        "Review unmatched and recommended transactions before reconciliation."
      ]}
      summary="Venmo reconciliation starts as safe CSV-based bookkeeping support for trainers, not a replacement payment system."
      title="Venmo Reconciliation"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Parses a Venmo-style CSV, creates an import batch, and recommends athlete matches."
          endpoint="/api/payments/venmo/import"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "trainerUserId", label: "Trainer user ID", required: true },
            { name: "originalFileName", label: "Original file name", placeholder: "optional" },
            {
              name: "csv",
              label: "CSV content",
              type: "textarea",
              required: true,
              defaultValue: 'Date,Amount,Name,Username,Note,ID\n2026-05-01,75.00,Alex Parent,@alexparent,"training session",txn_1'
            }
          ]}
          title="Import Venmo CSV"
        />
        <ApiGetViewer
          description="Loads normalized payment transactions and latest match records."
          endpointTemplate="/api/payments/transactions?organizationId={id}"
          idLabel="Organization ID"
          idPlaceholder="org_..."
          title="Load transactions"
        />
        <ApiForm
          description="Confirms a payment-to-athlete match or ignores a transaction."
          endpoint="/api/payments/transactions/{id}/match"
          fields={[
            { name: "id", label: "Transaction ID", required: true, omitFromPayload: true },
            { name: "playerId", label: "Player ID", placeholder: "required for matched status" },
            { name: "status", label: "Status", type: "select", options: ["matched", "ignored"], required: true },
            { name: "actorUserId", label: "Actor user ID", placeholder: "optional" }
          ]}
          title="Resolve transaction"
        />
      </div>
    </WorkflowPage>
  );
}

