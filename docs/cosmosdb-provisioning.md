# Cosmos DB Provisioning

This repo includes a standalone Azure Bicep template for provisioning Azure Cosmos DB for NoSQL:

- `infra/cosmosdb.bicep`
- `scripts/deploy-cosmosdb.ps1`

The template creates:

- Cosmos DB for NoSQL account.
- SQL database.
- SQL container.
- Serverless capacity mode.
- Session consistency by default.
- TLS 1.2 minimum.
- Key-based metadata writes disabled.

It outputs endpoint and resource IDs, but it does not print keys or connection strings.

## Deploy With PowerShell

```powershell
az login

.\scripts\deploy-cosmosdb.ps1 `
  -ResourceGroupName rg-trainer-dev `
  -Location eastus `
  -EnvironmentName dev `
  -DatabaseName trainer `
  -ContainerName items `
  -PartitionKeyPath /tenantId
```

Use `-WhatIf` to preview the deployment:

```powershell
.\scripts\deploy-cosmosdb.ps1 `
  -ResourceGroupName rg-trainer-dev `
  -Location eastus `
  -EnvironmentName dev `
  -WhatIf
```

Use a custom globally unique account name when needed:

```powershell
.\scripts\deploy-cosmosdb.ps1 `
  -ResourceGroupName rg-trainer-dev `
  -Location eastus `
  -EnvironmentName dev `
  -AccountName trainer-dev-cosmos-001
```

## Deploy With Azure CLI Directly

```powershell
az group create `
  --name rg-trainer-dev `
  --location eastus

az deployment group create `
  --resource-group rg-trainer-dev `
  --template-file infra/cosmosdb.bicep `
  --parameters environmentName=dev location=eastus databaseName=trainer containerName=items partitionKeyPath=/tenantId
```

## Notes

- Cosmos DB account names must be globally unique, lowercase, and 3-44 characters.
- `-EnableFreeTier` can only be used if the subscription does not already have a free-tier Cosmos DB account.
- `-DisableLocalAuth` should wait until the application uses Cosmos DB data-plane RBAC.
- `-PublicNetworkAccess Disabled` requires private endpoint networking before application traffic can reach the account.

Sources:

- Microsoft Learn: Azure Cosmos DB Bicep samples, https://learn.microsoft.com/azure/cosmos-db/manage-with-bicep
- Microsoft Learn: `Microsoft.DocumentDB/databaseAccounts`, https://learn.microsoft.com/azure/templates/Microsoft.DocumentDB/2025-05-01-preview/databaseaccounts
- Microsoft Learn: `Microsoft.DocumentDB/databaseAccounts/sqlDatabases`, https://learn.microsoft.com/azure/templates/microsoft.documentdb/2025-04-15/databaseaccounts/sqldatabases
- Microsoft Learn: `Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers`, https://learn.microsoft.com/azure/templates/microsoft.documentdb/2025-04-15/databaseaccounts/sqldatabases/containers
