# Integration tests

HTTP integration tests for the new hexagonal API routes, using Vitest + supertest against a real PostgreSQL database.

## Prerequisites

- Node 22 + Yarn
- Docker (for default `TEST_DB_MODE=docker`)

## Run locally (Docker test DB)

```bash
yarn test:integration
```

This will:

1. Start `docker-compose.test.yml` (PostGIS on port **5433**)
2. Bootstrap minimal `paises` / `estados` tables (fresh Docker DB has no legacy schema)
3. Run tests
4. Stop the test container

## Run against an existing database

```bash
TEST_DB_MODE=external \
  PG_DATABASE=herbario_test \
  PG_HOST=127.0.0.1 \
  PG_PORT=5432 \
  PG_USERNAME=postgres \
  PG_PASSWORD=masterkey \
  PG_MIGRATION_USERNAME=postgres \
  PG_MIGRATION_PASSWORD=masterkey \
  yarn test:integration
```

In `external` mode, pending Knex migrations are applied before tests (expects a database that already has the legacy schema, or migrations that can run cleanly).

## Watch mode

```bash
yarn test:integration:watch
```

## Environment

Copy or adjust [`.env.test`](../../.env.test) at the project root. `TEST_DB_MODE` defaults to `docker` when unset.
