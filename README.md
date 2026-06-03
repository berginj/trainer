# Trainer

Youth training and performance tracking platform for team onboarding, athlete safety signals, home routines, guardian consent, reports, and operational admin workflows.

## Documents

- [Research report](deep-research-report.md)
- [Build and deployment plan](BUILD_DEPLOYMENT_PLAN.md)
- [Backlog](BACKLOG.md)
- [Azure deployment setup](docs/azure-deployment.md)
- [Operations runbooks](docs/runbooks.md)
- [Personas and workflows](docs/personas-and-workflows.md)
- [UX screen review](docs/ux-screen-review.md)
- [Cosmos DB provisioning](docs/cosmosdb-provisioning.md)
- [GameChanger data integration plan](docs/gamechanger-data-plan.md)

## Development

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run test:integration:db
npm run prisma:validate
npm run prisma:generate
npm run build
```

The application exposes health endpoints at `/api/health` and `/api/health/dependencies`.

`npm run test:integration:db` requires `TEST_DATABASE_URL`; when it is not set, the DB-backed route suite is skipped.

## Current Deployment

The dev Azure Container App is available at:

```text
https://trainer-dev1.greenground-5002c3bc.eastus2.azurecontainerapps.io
```

As of June 2, 2026, the deployed service health endpoints return HTTP 200, database dependency health is OK, and Azure Container Apps is serving revision `trainer-dev1--0000020` from commit `bf663b2`. Local Playwright smoke coverage is green after the `/routines` assignment success-message fix; deploys from `main` are gated behind successful CI before the dev auto-deploy workflow runs.

## Database

Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database before running database-backed API routes or seed commands.

```powershell
npm run prisma:generate
npm run prisma:seed
```

## MVP Surface

The current MVP includes role-aware home routing, Google/Microsoft OAuth scaffolding, invite-based role mapping, team branding, bulk roster entry, guardian consent, parent and athlete homes, team/player/admin dashboards, routine assignment and completion, goals, monthly report generation/viewing, alert handling, GameChanger and calendar/payment foundations, and Azure dev deployment support.
