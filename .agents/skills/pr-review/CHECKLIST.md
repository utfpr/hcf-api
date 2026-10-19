# PR review domain checklist

Read this during Phase 4 when the matching lens is selected. Skip sections whose paths are not in the PR.

Cursor rules (read the `.mdc` when the diff matches; do not copy drifted names already in the tree):

- `.cursor/rules/hexagonal-layers.mdc` — any change under `src/domain`, `src/application`, `src/infrastructure`, `src/library`, `src/factory`
- `.cursor/rules/domain-entities.mdc` — entities, `Either`, `static create`
- `.cursor/rules/collection-adapters.mdc` — `*Collection` ports and Knex adapters
- `.cursor/rules/http-adapters.mdc` — controllers, middleware, `library/http`
- `.cursor/rules/type-and-file-names.mdc` — new or renamed controllers, use cases, tests
- `.cursor/rules/use-case-boundaries.mdc` — new or changed `*UseCase`
- `.cursor/rules/prefer-classes-over-functions.mdc` — new exported collaborator
- `.cursor/rules/error-classes-own-files.mdc` — new or moved error class

Copy `CriaUsuarioSessaoUseCase`, `UsuarioSessao`, `CriaUsuarioSessaoController`, `UsuarioCollectionKnexAdapter`. Do not copy `ListaSolosUseCase`, `BuscarSoloPorIdUseCase`, `BuscaSoloController` (all `left` → 500), `SoloCollectionKnexAdapter` (raw `Attributes`), or `application/fase-sucessional`.

## HTTP / Express

- Hex controllers follow `http-adapters.mdc`: `RequestHandler`, parse, call one use case **or** (catalog list/get) one collection, map `Either` with `instanceof`. Do not treat every `left` as `InternalServerError`.
- New hex routes: `routes()` in `src/application/{feature}/index.ts`, spread in `create-app` before `legacyRouter`. Do not register hex handlers on `src/routes/*.js`.
- Names: `{Verb}{Resource(s)}Controller` with a Portuguese 3rd-person verb (`ListaPaisesController`, `BuscaSoloController`), not the infinitive (`Listar*`, `Buscar*`). Flag leftover old files after a rename. `Encontra*` is not an allowed verb for new types.
- Folders camelCase (`usuarioSessao`). `application/fase-sucessional` is drift.
- Controllers do not import Knex, `jsonwebtoken`, or `@/infrastructure`. Cookies / CSRF stay in application helpers.
- New or changed routes sit behind the same auth middleware as siblings (`src/middlewares`, hex `AuthorizeMiddleware`).
- Validators run before controllers; invalid input maps to 4xx, not 500.
- Status codes match `src/library/http/error`. HTTP `NotFoundError` is not a domain error.
- No raw stack traces or SQL in responses.
- Rate limiting / helmet / CORS changes are intentional and do not open the API.

## Domain / use cases

- Use cases live in `src/domain/{aggregate}`, not `src/application`. Domain imports `library` only — no Knex, Express, or `@/infrastructure`.
- v2 types follow `type-and-file-names.mdc` (list → plural; one entity → singular). Do not introduce infinitives (`Listar*`, `Buscar*`). Existing `BuscarVegetacao*` / `BuscarSolo*` are drift — do not copy.
- A use case is one **user intention** (login, renew a session). Fold credential checks, persist, and tokens into the same `execute`. Do not add a new `Lista*` / `Busca*PorId` use case whose `execute` only forwards to the collection — the controller calls the collection. `ListaSolosUseCase` is drift.
- Do not import or inject `FooUseCase` inside `BarUseCase`. Share the **port**.
- A one-field invariant (`nome` not empty) still belongs on the entity. Private constructor, `static create` → `Either`. Named transitions go through `create`. New rows omit store identity — no `id: 0`.
- New collection `find*` methods return `Entity` / `Entity[]`, not raw `Attributes`. Adapters map columns then call `create` (`collection-adapters.mdc`). `SoloCollectionKnexAdapter` is drift.
- New collaborators: **class** (`prefer-classes-over-functions.mdc`). Functions allowed for `routes`, `createApp`, `singleton`, `authorize`, and pure transforms (`parseOrder`).
- Each new error class is its own file under the layer’s `error/` (`error-classes-own-files.mdc`). New errors in a Portuguese module get Portuguese names. Do not invent `ValidationError` / `ConflictError` unless the PR adds those types.

## Persistence (Sequelize, Knex, migrations)

- Migrations are forward-safe: no `DROP` / `TRUNCATE` of live data without an explicit backfill or feature-flag story in the PR body.
- Boolean/smallint conversions and sequence fixes do not leave mixed types.
- Indexes exist for new filter/join columns used in list endpoints.
- Multi-write flows (tombo + related tables) use a transaction.
- Knex vs Sequelize: do not query a table the other layer just renamed without updating both.
- New Knex adapters implement the domain port, map snake_case, call `Entity.create`, and wrap I/O in `CollectionError`. Do not return query rows as `Attributes` on a new port.
- Dialect-specific SQL (`ILIKE`, `jsonb`, GIS) must target the right database (app vs integration Postgres/PostGIS).

## Auth / secrets

- JWT/bcrypt changes do not weaken expiry, secret source, or comparison.
- New endpoints that read/write tombos, users, or remessas are not accidentally public.
- No tokens, passwords, or connection strings in diffs, logs, or Darwin Core exports.

## Tests

- One test file per type: same TitleCase name as the type (`ListaPaisesUseCase.test.ts`, `EncontraVegetacoesController.test.ts`). Do not use a different verb or pack several actions in one file.
- New use case or route: unit test next to existing Vitest projects, or integration test if it needs the DB.
- Behavior-neutral refactors do not require new tests; broken or missing coverage for **new** branches is a blocker.
- Do not run `yarn test` as part of this skill.

## Herbarium / Darwin Core / Splink / Reflora

- Tombo identity (HCF number / barcode) is not reassigned or duplicated.
- Scientific name order: gênero, espécie, subespécie, variedade — do not drop ranks the API already stores.
- Coordenadas vs município polígono: changes in polygon/gist indexes or coordinate updates must not silently mark valid tombos as out-of-polygon (or the reverse) without tests or a clear migration note.
- Darwin Core / SpeciesLink / Reflora exporters: column headers and required fields stay aligned with `src/resources/darwincore` and `src/herbarium`.
- RFID / remessa / ficha tombo: file and status transitions stay consistent with existing controllers.

## Reports

- React/EJS report templates: data shaping in helpers matches template fields; empty lists do not crash render.

## Infra / ops

- Compose, Ansible, and GitHub workflow changes must not leak secrets or weaken the integration-test DB password handling in a way that affects production playbooks.
- Workflow `pull_request.yml` jobs (lint, unit, integration, build, trivy) should stay present unless the PR is deliberately changing CI.
