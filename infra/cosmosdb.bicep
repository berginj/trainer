targetScope = 'resourceGroup'

@description('Deployment environment name used for tags and defaults.')
@allowed([
  'dev'
  'test'
  'staging'
  'prod'
])
param environmentName string = 'dev'

@description('Azure region for the Cosmos DB account.')
param location string = resourceGroup().location

@description('Cosmos DB account name. Must be globally unique, lowercase, and 3-44 characters.')
@minLength(3)
@maxLength(44)
param accountName string = 'cosmos-${uniqueString(resourceGroup().id, environmentName)}'

@description('Cosmos DB for NoSQL database name.')
param databaseName string = 'trainer'

@description('Cosmos DB for NoSQL container name.')
param containerName string = 'items'

@description('Container partition key path. Use a tenant-aware key for multi-tenant data.')
param partitionKeyPath string = '/tenantId'

@description('Default consistency level for the account.')
@allowed([
  'Eventual'
  'ConsistentPrefix'
  'Session'
  'BoundedStaleness'
  'Strong'
])
param defaultConsistencyLevel string = 'Session'

@description('Whether to enable the Cosmos DB free tier. Only one free-tier account is allowed per Azure subscription.')
param enableFreeTier bool = false

@description('Whether key-based data plane auth is disabled. Keep false until the app is using Cosmos DB data-plane RBAC.')
param disableLocalAuth bool = false

@description('Public network access for the Cosmos DB account.')
@allowed([
  'Enabled'
  'Disabled'
])
param publicNetworkAccess string = 'Enabled'

@description('Optional IP allow-list entries, such as build agent or office NAT IPs. Leave empty for no firewall IP rules.')
param allowedIpRanges array = []

@description('Whether the primary region should use zone redundancy.')
param zoneRedundant bool = false

@description('Tags applied to all resources.')
param tags object = {
  app: 'trainer'
  environment: environmentName
  managedBy: 'bicep'
}

resource account 'Microsoft.DocumentDB/databaseAccounts@2025-04-15' = {
  name: toLower(accountName)
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: defaultConsistencyLevel
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: zoneRedundant
      }
    ]
    enableAutomaticFailover: false
    enableFreeTier: enableFreeTier
    enableMultipleWriteLocations: false
    disableKeyBasedMetadataWriteAccess: true
    disableLocalAuth: disableLocalAuth
    ipRules: [for ipRange in allowedIpRanges: {
      ipAddressOrRange: ipRange
    }]
    isVirtualNetworkFilterEnabled: false
    minimalTlsVersion: 'Tls12'
    networkAclBypass: 'None'
    networkAclBypassResourceIds: []
    publicNetworkAccess: publicNetworkAccess
    virtualNetworkRules: []
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2025-04-15' = {
  parent: account
  name: databaseName
  location: location
  tags: tags
  properties: {
    resource: {
      id: databaseName
    }
    options: {}
  }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2025-04-15' = {
  parent: database
  name: containerName
  location: location
  tags: tags
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        kind: 'Hash'
        paths: [
          partitionKeyPath
        ]
        version: 2
      }
    }
    options: {}
  }
}

output accountName string = account.name
output accountEndpoint string = account.properties.documentEndpoint
output databaseName string = database.name
output containerName string = container.name
output accountResourceId string = account.id
output databaseResourceId string = database.id
output containerResourceId string = container.id
