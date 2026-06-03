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

@description('Azure region for PostgreSQL. Use this to target an existing server in a different region.')
param postgresLocation string = location

@description('Container image used for first infrastructure creation.')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Existing Container Apps managed environment resource ID. Leave blank to create one in this resource group.')
param containerAppEnvironmentId string = ''

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
param postgresServerName string = toLower('trainer-${environmentName}-${uniqueString(resourceGroup().id, environmentName)}')
param alertEmailAddress string = ''
param enableRoleAssignments bool = true
param tags object = {
  app: 'trainer'
  environment: environmentName
  managedBy: 'bicep'
}

var uniqueSuffix = uniqueString(resourceGroup().id, environmentName)
var logAnalyticsName = 'log-trainer-${environmentName}-${uniqueSuffix}'
var appInsightsName = 'appi-trainer-${environmentName}-${uniqueSuffix}'
var containerAppEnvName = 'cae-trainer-${environmentName}-${uniqueSuffix}'
var keyVaultName = toLower('kv-trainer-${environmentName}-${substring(uniqueSuffix, 0, 8)}')
var storageAccountName = toLower('sttrainer${environmentName}${substring(uniqueSuffix, 0, 8)}')
var serviceBusNamespaceName = toLower('sb-trainer-${environmentName}-${uniqueSuffix}')
var serviceBusQueueName = 'trainer-jobs'
var appConfigName = toLower('appcs-trainer-${environmentName}-${uniqueSuffix}')
var frontDoorProfileName = toLower('afdp-trainer-${environmentName}-${uniqueSuffix}')
var frontDoorEndpointName = toLower('trainerp-${environmentName}-${substring(uniqueSuffix, 0, 8)}')
var frontDoorOriginGroupName = 'container-app-origin-group'
var frontDoorOriginName = 'container-app-origin'
var frontDoorRouteName = 'default-route'
var monitorActionGroupName = 'ag-trainer-${environmentName}'
var databaseUrl = 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgresServerName}.postgres.database.azure.com:5432/${databaseName}?sslmode=require'
var googleAuthClientSecretValue = empty(googleAuthClientSecret) ? 'not-configured' : googleAuthClientSecret
var acrPullRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
var storageBlobDataContributorRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
var serviceBusDataOwnerRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '090c5cfd-751d-490a-894a-3ce6f1109419')
var appConfigurationDataReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '516239f1-63e1-4d78-a4de-a74fb236a071')

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

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: postgresServerName
  location: postgresLocation
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

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 30
    }
  }
}

resource appBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobServices
  name: 'trainer-artifacts'
  properties: {
    publicAccess: 'None'
  }
}

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusNamespaceName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true
  }
}

resource serviceBusQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: serviceBusQueueName
  properties: {
    deadLetteringOnMessageExpiration: true
    defaultMessageTimeToLive: 'P14D'
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    enableBatchedOperations: true
    lockDuration: 'PT1M'
    maxDeliveryCount: 5
    requiresDuplicateDetection: true
  }
}

resource appConfig 'Microsoft.AppConfiguration/configurationStores@2023-03-01' = {
  name: appConfigName
  location: location
  tags: tags
  sku: {
    name: 'standard'
  }
  properties: {
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
  }
}

resource storageBlobAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableRoleAssignments) {
  name: guid(storageAccount.id, containerApp.id, 'storage-blob-data-contributor')
  scope: storageAccount
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageBlobDataContributorRoleId
  }
}

resource serviceBusAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableRoleAssignments) {
  name: guid(serviceBusNamespace.id, containerApp.id, 'service-bus-data-owner')
  scope: serviceBusNamespace
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: serviceBusDataOwnerRoleId
  }
}

resource appConfigAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableRoleAssignments) {
  name: guid(appConfig.id, containerApp.id, 'app-configuration-data-reader')
  scope: appConfig
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: appConfigurationDataReaderRoleId
  }
}

resource containerEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = if (empty(containerAppEnvironmentId)) {
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
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: empty(containerAppEnvironmentId) ? containerEnvironment.id : containerAppEnvironmentId
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
          identity: 'system'
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
          value: googleAuthClientSecretValue
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
            {
              name: 'AZURE_STORAGE_ACCOUNT_NAME'
              value: storageAccount.name
            }
            {
              name: 'AZURE_BLOB_CONTAINER_NAME'
              value: appBlobContainer.name
            }
            {
              name: 'SERVICE_BUS_NAMESPACE'
              value: serviceBusNamespace.name
            }
            {
              name: 'SERVICE_BUS_QUEUE_NAME'
              value: serviceBusQueue.name
            }
            {
              name: 'AZURE_APP_CONFIG_ENDPOINT'
              value: appConfig.properties.endpoint
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
    postgresDatabase
    allowAzureServices
  ]
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableRoleAssignments) {
  name: guid(acr.id, containerApp.id, 'acr-pull')
  scope: acr
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleId
  }
}

resource frontDoorProfile 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: frontDoorProfileName
  location: 'global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
  }
}

resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: frontDoorProfile
  name: frontDoorEndpointName
  location: 'global'
  properties: {
    enabledState: 'Enabled'
  }
}

resource frontDoorOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoorProfile
  name: frontDoorOriginGroupName
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      probePath: '/api/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
    sessionAffinityState: 'Disabled'
  }
}

resource frontDoorOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: frontDoorOriginGroup
  name: frontDoorOriginName
  properties: {
    hostName: containerApp.properties.configuration.ingress.fqdn
    originHostHeader: containerApp.properties.configuration.ingress.fqdn
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

resource frontDoorRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: frontDoorEndpoint
  name: frontDoorRouteName
  properties: {
    originGroup: {
      id: frontDoorOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
  }
  dependsOn: [
    frontDoorOrigin
  ]
}

resource monitorActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: monitorActionGroupName
  location: 'global'
  tags: tags
  properties: {
    enabled: true
    groupShortName: 'trainer'
    emailReceivers: empty(alertEmailAddress) ? [] : [
      {
        name: 'operations'
        emailAddress: alertEmailAddress
        useCommonAlertSchema: true
      }
    ]
  }
}

resource failedRequestAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'ma-trainer-${environmentName}-failed-requests'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alerts when Application Insights records failed requests.'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'FailedRequests'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: monitorActionGroup.id
      }
    ]
  }
}

resource serverExceptionAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'ma-trainer-${environmentName}-server-exceptions'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alerts when Application Insights records server exceptions.'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ServerExceptions'
          metricName: 'exceptions/server'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: monitorActionGroup.id
      }
    ]
  }
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output containerAppName string = containerApp.name
output appFqdn string = containerApp.properties.configuration.ingress.fqdn
output frontDoorEndpointHostName string = frontDoorEndpoint.properties.hostName
output postgresServerName string = postgres.name
output databaseName string = postgresDatabase.name
output keyVaultName string = keyVault.name
output storageAccountName string = storageAccount.name
output serviceBusNamespaceName string = serviceBusNamespace.name
output appConfigEndpoint string = appConfig.properties.endpoint
