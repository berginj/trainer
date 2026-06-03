targetScope = 'resourceGroup'

@description('Deployment environment name.')
@allowed([
  'dev'
  'test'
  'staging'
  'prod'
])
param environmentName string = 'dev'

@description('Azure region.')
param location string = resourceGroup().location

@description('Container image used for first infrastructure creation.')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('PostgreSQL administrator login.')
param postgresAdminLogin string = 'traineradmin'

@secure()
@description('PostgreSQL administrator password.')
param postgresAdminPassword string

@secure()
@description('Signed app session secret.')
param authSecret string

@secure()
@description('Token encryption key for OAuth-related encrypted values.')
param tokenEncryptionKey string

@description('Google OAuth app client ID.')
param googleAuthClientId string = ''

@secure()
@description('Google OAuth app client secret.')
param googleAuthClientSecret string = ''

@description('Microsoft OAuth app client ID.')
param microsoftAuthClientId string = ''

@secure()
@description('Microsoft OAuth app client secret.')
param microsoftAuthClientSecret string = ''

param appName string = 'trainer-${environmentName}'
param acrName string = toLower(replace('trainer${environmentName}${uniqueString(resourceGroup().id, environmentName)}', '-', ''))
param databaseName string = 'trainer'
param tags object = {
  app: 'trainer'
  environment: environmentName
  managedBy: 'bicep'
}

var uniqueSuffix = uniqueString(resourceGroup().id, environmentName)
var postgresName = toLower('trainer-${environmentName}-${uniqueSuffix}')
var logAnalyticsName = 'log-trainer-${environmentName}-${uniqueSuffix}'
var appInsightsName = 'appi-trainer-${environmentName}-${uniqueSuffix}'
var managedIdentityName = 'id-trainer-${environmentName}-${uniqueSuffix}'
var containerAppEnvName = 'cae-trainer-${environmentName}-${uniqueSuffix}'
var keyVaultName = toLower('kv-trainer-${environmentName}-${substring(uniqueSuffix, 0, 8)}')
var databaseUrl = 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgres.name}.postgres.database.azure.com:5432/${databaseName}?schema=public&sslmode=require'
var acrPullRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  tags: tags
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: tags
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, 'acr-pull')
  scope: acr
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleId
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: postgresName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    version: '16'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgres
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enabledForTemplateDeployment: true
    publicNetworkAccess: 'Enabled'
  }
}

resource containerEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
      secrets: [
        {
          name: 'database-url'
          #disable-next-line use-secure-value-for-secure-inputs
          value: databaseUrl
        }
        {
          name: 'auth-secret'
          value: authSecret
        }
        {
          name: 'token-encryption-key'
          value: tokenEncryptionKey
        }
        {
          name: 'google-auth-client-secret'
          value: googleAuthClientSecret
        }
        {
          name: 'microsoft-auth-client-secret'
          value: microsoftAuthClientSecret
        }
      ]
    }
    template: {
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
      containers: [
        {
          name: 'trainer'
          image: containerImage
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'AUTH_ENFORCEMENT'
              value: 'on'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'AUTH_SECRET'
              secretRef: 'auth-secret'
            }
            {
              name: 'TOKEN_ENCRYPTION_KEY'
              secretRef: 'token-encryption-key'
            }
            {
              name: 'TOKEN_ENCRYPTION_KEY_VERSION'
              value: 'v1'
            }
            {
              name: 'GOOGLE_AUTH_CLIENT_ID'
              value: googleAuthClientId
            }
            {
              name: 'GOOGLE_AUTH_CLIENT_SECRET'
              secretRef: 'google-auth-client-secret'
            }
            {
              name: 'MICROSOFT_AUTH_CLIENT_ID'
              value: microsoftAuthClientId
            }
            {
              name: 'MICROSOFT_AUTH_CLIENT_SECRET'
              secretRef: 'microsoft-auth-client-secret'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsights.properties.ConnectionString
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
    }
  }
  dependsOn: [
    acrPull
    postgresDatabase
    allowAzureServices
  ]
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output containerAppName string = containerApp.name
output appFqdn string = containerApp.properties.configuration.ingress.fqdn
output postgresServerName string = postgres.name
output databaseName string = postgresDatabase.name
output keyVaultName string = keyVault.name
