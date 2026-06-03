# Trainer Operations Runbooks

These runbooks are for the current Azure dev fielding environment:

- Container App: `trainer-dev1`
- Resource group: `rg-trainer-dev`
- ACR: `trainerdevacr`
- PostgreSQL server: `trainer-dev1-pg`
- Public URL: `https://trainer-dev1.greenground-5002c3bc.eastus2.azurecontainerapps.io`

## Release Health Check

Run after every deployment:

```powershell
az containerapp revision list --name trainer-dev1 --resource-group rg-trainer-dev --query "[].{name:name,active:properties.active,runningState:properties.runningState,trafficWeight:properties.trafficWeight,image:properties.template.containers[0].image}" -o table
node -e "fetch('https://trainer-dev1.greenground-5002c3bc.eastus2.azurecontainerapps.io/api/health/dependencies').then(async r=>{console.log(r.status); console.log(await r.text())})"
```

Expected result: the latest revision has `trafficWeight` 100 and dependency health returns `status: ok`. Blob Storage and Service Bus may report `not_configured` until those backlog items are rolled out.

## Rollback

Use this when the latest revision is unhealthy or a production workflow is broken.

1. List revisions and identify the previous healthy image.
2. Update the Container App back to that image.
3. Preserve all current env vars and secret refs.
4. Re-run the release health check.

```powershell
$image = "<previous healthy image>"
az containerapp update --name trainer-dev1 --resource-group rg-trainer-dev --image $image --set-env-vars NODE_ENV=production AUTH_ENFORCEMENT=off DATABASE_URL=secretref:database-url AUTH_SECRET=secretref:auth-secret TOKEN_ENCRYPTION_KEY=secretref:token-encryption-key TOKEN_ENCRYPTION_KEY_VERSION=v1 MICROSOFT_AUTH_CLIENT_ID=ccdda902-1f14-4bb8-a651-64ceb12e9f1d MICROSOFT_AUTH_CLIENT_SECRET=secretref:microsoft-auth-client-secret SEED_CYCLONES_MVP=off --min-replicas 1 --max-replicas 1
```

## Database Restore Drill

Use Azure PostgreSQL Flexible Server point-in-time restore.

1. In Azure, restore `trainer-dev1-pg` to a new server name.
2. Create a temporary `DATABASE_URL` for the restored server.
3. Run `npm run prisma:migrate:deploy` against the restored database to verify schema compatibility.
4. Run a read-only smoke check against restored data.
5. Do not point the live Container App at the restored database unless this is an approved incident recovery.

## Secret Rotation

Rotate one secret at a time.

1. Add the replacement value to the Container App secret with the existing secret name.
2. Restart or update the Container App revision so the container picks up the new value.
3. Verify sign-in, `/api/health/dependencies`, and one authenticated workflow.
4. For `AUTH_SECRET`, expect existing sessions and OAuth states to become invalid.
5. For `TOKEN_ENCRYPTION_KEY`, keep `TOKEN_ENCRYPTION_KEY_VERSION` aligned with the active key plan before rotating stored encrypted tokens.

## Consent Incident

Use when a guardian reports incorrect consent or a player appears accessible without proper consent.

1. Record the player, guardian email, timestamp, and route involved.
2. Check `/admin` for consent gaps and recent audit events.
3. Revoke or correct consent records directly only after confirming the guardian/player relationship.
4. Keep `AUTH_ENFORCEMENT=off` only for controlled dev testing. Before production, turn enforcement on in a staging environment and verify guardian, coach, and admin paths.
5. Document the incident and follow legal/privacy review before production use with children.

## Data Exposure Incident

Use when private player data may have been exposed.

1. Stop further spread: disable the affected invite, account, or revision.
2. Preserve evidence: request IDs, audit events, revision image, and approximate time window.
3. Identify impacted players and guardians from audit events and membership links.
4. Rotate any exposed secrets or invite tokens.
5. Notify stakeholders according to the legal/privacy policy before production use.

## Queue And DLQ Replay

Service Bus is not configured in the current dev environment, so there is no live DLQ to replay.

When Service Bus is added:

1. Inspect DLQ message count and oldest enqueue time.
2. Export a sample payload before replay.
3. Replay only idempotent messages after confirming the handler dedupe key.
4. Move poison messages to an incident archive with the request ID and failure reason.

## Deployment Failure

Common failure modes:

- `az acr build` may fail locally on Windows while streaming logs because the Azure CLI cannot encode a Unicode checkmark. If the run was queued, poll ACR run status before retrying.
- `npm ci` inside ACR can fail with transient network `ECONNRESET`. Retry with a new immutable tag.
- If Container App starts but dependency health fails database, verify the `database-url` secret and PostgreSQL firewall/private access settings.

## Fielding Checklist

Before using with real families:

1. Confirm Microsoft sign-in works for the intended accounts.
2. Confirm the signed-in operator has `org_admin`, `team_coach`, or `guardian` role as appropriate.
3. Add players through `/roster` and generate guardian invite links.
4. Have guardians accept invites and grant consent from `/guardian/home`.
5. Verify `/admin` has zero unexpected consent or guardian gaps.
6. Keep health checks and rollback image information available during every live session.
