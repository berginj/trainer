# Azure Deployment Workflow Setup

The deployment workflow is `.github/workflows/azure-deploy.yml`. It is manually triggered with `workflow_dispatch` and is safe to keep in the repo before Azure resources exist.

## Required GitHub Environments

Create these GitHub environments:

- `dev`
- `test`
- `staging`
- `prod`

Production should require manual approval in GitHub environment protection rules.

## Required Environment Variables

Set these as GitHub environment variables for each environment:

| Variable | Purpose |
|---|---|
| `AZURE_CLIENT_ID` | Federated identity app/client ID used by `azure/login`. |
| `AZURE_TENANT_ID` | Microsoft Entra tenant ID. |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID. |
| `AZURE_RESOURCE_GROUP` | Target resource group. |
| `ACR_NAME` | Azure Container Registry name. |
| `ACR_LOGIN_SERVER` | ACR login server, for example `trainer.azurecr.io`. |
| `CONTAINER_APP_NAME` | Azure Container Apps app name. |
| `APP_BASE_URL` | Public app base URL for smoke tests. |
| `GOOGLE_AUTH_CLIENT_ID` | Google OAuth client ID for guardian/coach sign-in. |
| `MICROSOFT_AUTH_CLIENT_ID` | Microsoft identity client ID configured for personal Microsoft accounts. |

## Required Secrets

Set these as GitHub environment secrets:

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by the migration gate. |
| `POSTGRES_ADMIN_PASSWORD` | PostgreSQL admin password used by Bicep for the MVP database. |
| `AUTH_SECRET` | HMAC secret for app session cookies and OAuth state. |
| `TOKEN_ENCRYPTION_KEY` | Shared encryption/signing fallback for token-related helpers. |
| `GOOGLE_AUTH_CLIENT_SECRET` | Google OAuth client secret. |
| `MICROSOFT_AUTH_CLIENT_SECRET` | Microsoft OAuth client secret. |

## Current Placeholders

The workflow includes placeholders that intentionally no-op or fail clearly until the related work is complete:

- `infra/main.bicep` provisions the single-environment MVP stack: ACR, Container Apps, PostgreSQL, Key Vault, Log Analytics, and Application Insights.
- Prisma migrations exist, so the migration gate runs `npm run prisma:migrate:deploy` when `DATABASE_URL` is configured.
- Docker image validation will happen in GitHub-hosted runners even though Docker is not installed locally.

## OIDC Setup

Configure a federated credential in Microsoft Entra for each GitHub environment. The subject should follow the GitHub environment pattern:

```text
repo:<owner>/<repo>:environment:<environment>
```

Use least privilege for the federated identity. It needs only enough access to:

- Push to ACR.
- Deploy Bicep to the target resource group.
- Update the Container App revision.

## Activation Checklist

1. Configure GitHub environments, variables, and secrets.
2. Configure Entra federated credentials for GitHub OIDC.
3. Create Google OAuth and Microsoft personal-account OAuth app registrations with callback URLs:
   - `https://<app-host>/api/auth/google/callback`
   - `https://<app-host>/api/auth/microsoft/callback`
4. Trigger `Azure Deploy` manually for `dev`; the workflow deploys infra before pushing the app image.
5. Set or confirm the `DATABASE_URL` environment secret and verify `npm run prisma:migrate:deploy` succeeds for `dev`.
6. Run `SEED_CYCLONES_MVP=on npm run prisma:seed` against the Azure database when you want the Cyclones organization/team bootstrap.
7. Verify `/api/health`, `/api/health/dependencies`, `/signin`, `/routines`, and `/guardian/home`.

## Operations

Use `docs/runbooks.md` for rollback, restore drills, secret rotation, consent incidents, data exposure incidents, queue/DLQ handling, and fielding checks.
