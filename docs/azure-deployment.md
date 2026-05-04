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

## Required Secrets

Set these as GitHub environment secrets:

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by the migration gate. |

## Current Placeholders

The workflow includes placeholders that intentionally no-op or fail clearly until the related work is complete:

- `infra/main.bicep` does not exist yet, so Bicep what-if/deploy steps skip with a clear message.
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

1. Create Azure resources or add `infra/main.bicep`.
2. Configure GitHub environments, variables, and secrets.
3. Configure Entra federated credentials for GitHub OIDC.
4. Configure the `DATABASE_URL` environment secret and verify `npm run prisma:migrate:deploy` succeeds for `dev`.
5. Trigger `Azure Deploy` manually for `dev`.
6. Verify `/api/health` and `/api/health/dependencies`.
