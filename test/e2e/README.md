# Integration Tests

Integration tests run against a real PostgreSQL database. **You are responsible for
starting the container and applying migrations before running the tests.**

## Prerequisites

- Docker installed and running
- Node.js dependencies installed (`npm install`)

## First-time setup

### 1. Start the test database

```bash
docker compose -f compose.e2e.yml up -d
```

This starts a PostgreSQL container on port **5433** using the credentials in `.env`.

### 2. Apply migrations

```bash
npm run migration:apply
```

This runs the full migration stack against the database defined in `.env`. You only need to
re-run this when new migrations are added.

## Running the tests

```bash
npm run test:integration
```

The test suite connects to the already-running database and executes all tests
in `test/integration/`. No schema changes are made at test time.

For watch mode (re-runs on file changes):

```bash
npm run test:integration:watch
```

## Stopping the database

```bash
docker compose -f compose.e2e.yml down
```

Since the container uses `tmpfs`, all data is lost when it stops. Start fresh
next time with `docker compose up -d` followed by `migration:apply`.

---

## Writing new integration tests

Each test file must own its data:

- **`beforeAll`** — insert only the rows your tests need, using a unique prefix in any
  identifier column (sigla, nome, etc.) that distinguishes your rows from other test files.
- **`afterAll`** — delete your rows and call `knex.destroy()` to release the connection pool.
- Never use `TRUNCATE` — it would wipe data owned by other test files running in parallel.

See `test/integration/pais/lista-paises.test.ts` for a concrete example.

### Seed helpers

Reusable seed/cleanup functions live in `test/integration/setup/seeds/`. Create one file per
domain entity. Each file should export:

| Export | Purpose |
|---|---|
| `seed*(knex)` | Inserts rows and returns them with auto-generated IDs |
| `cleanup*(knex)` | Deletes only the rows owned by that seed file |

### Namespace convention

Use a short, unique prefix for identifiers to avoid collisions between test files:

| Test file | Prefix used |
|---|---|
| `lista-paises.test.ts` | `XPBR`/`XPAR` (pais sigla), `XPAI ` (nome prefix) |
| `lista-estados.test.ts` | `XEBR`/`XEAR` (pais sigla), `XEPR`/`XESP`/`XEBA` (estado sigla) |
