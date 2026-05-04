# Trainer

Youth training and performance tracking platform planning repo.

## Documents

- [Research report](deep-research-report.md)
- [Build and deployment plan](BUILD_DEPLOYMENT_PLAN.md)
- [Backlog](BACKLOG.md)
- [Azure deployment setup](docs/azure-deployment.md)
- [Cosmos DB provisioning](docs/cosmosdb-provisioning.md)
- [GameChanger data integration plan](docs/gamechanger-data-plan.md)

## Development

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run prisma:validate
npm run prisma:generate
npm run build
```

The application exposes health endpoints at `/api/health` and `/api/health/dependencies`.

## Database

Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database before running database-backed API routes or seed commands.

```powershell
npm run prisma:generate
npm run prisma:seed
```

## MVP API Surface

Initial route handlers exist for organizations, seasons, teams, players, guardians, evaluations, measurements, readiness checks, workload entries, routine assignments, routine completions, metric definitions, and alert evaluation.
