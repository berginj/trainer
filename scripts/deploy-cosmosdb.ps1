[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string] $ResourceGroupName,

  [Parameter(Mandatory = $false)]
  [string] $Location = "eastus",

  [Parameter(Mandatory = $false)]
  [ValidateSet("dev", "test", "staging", "prod")]
  [string] $EnvironmentName = "dev",

  [Parameter(Mandatory = $false)]
  [string] $AccountName,

  [Parameter(Mandatory = $false)]
  [string] $DatabaseName = "trainer",

  [Parameter(Mandatory = $false)]
  [string] $ContainerName = "items",

  [Parameter(Mandatory = $false)]
  [string] $PartitionKeyPath = "/tenantId",

  [Parameter(Mandatory = $false)]
  [string[]] $AllowedIpRanges = @(),

  [Parameter(Mandatory = $false)]
  [switch] $EnableFreeTier,

  [Parameter(Mandatory = $false)]
  [switch] $DisableLocalAuth,

  [Parameter(Mandatory = $false)]
  [ValidateSet("Enabled", "Disabled")]
  [string] $PublicNetworkAccess = "Enabled",

  [Parameter(Mandatory = $false)]
  [string] $SubscriptionId,

  [Parameter(Mandatory = $false)]
  [switch] $WhatIf
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  throw "Azure CLI is required. Install it from https://learn.microsoft.com/cli/azure/install-azure-cli and run 'az login'."
}

$templateFile = Resolve-Path (Join-Path $PSScriptRoot "..\infra\cosmosdb.bicep")

if ($SubscriptionId) {
  az account set --subscription $SubscriptionId | Out-Null
}

az group create `
  --name $ResourceGroupName `
  --location $Location `
  --tags app=trainer environment=$EnvironmentName managedBy=script | Out-Null

$parameters = @(
  "environmentName=$EnvironmentName",
  "location=$Location",
  "databaseName=$DatabaseName",
  "containerName=$ContainerName",
  "partitionKeyPath=$PartitionKeyPath",
  "enableFreeTier=$($EnableFreeTier.IsPresent.ToString().ToLowerInvariant())",
  "disableLocalAuth=$($DisableLocalAuth.IsPresent.ToString().ToLowerInvariant())",
  "publicNetworkAccess=$PublicNetworkAccess"
)

if ($AccountName) {
  $parameters += "accountName=$AccountName"
}

if ($AllowedIpRanges.Count -gt 0) {
  $allowedIpRangesJson = ConvertTo-Json -Compress -InputObject $AllowedIpRanges
  $parameters += "allowedIpRanges=$allowedIpRangesJson"
}

if ($WhatIf) {
  az deployment group what-if `
    --resource-group $ResourceGroupName `
    --template-file $templateFile `
    --parameters $parameters
} else {
  az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file $templateFile `
    --parameters $parameters `
    --query "properties.outputs" `
    --output json
}
