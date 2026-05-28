# HCF API — Architecture Migration Spec

## Overview

Incrementally refactor the HCF API from a classic `routes → controllers → models` monolith into a lightweight hexagonal (ports & adapters) architecture. The reference model for layer structure is the [`lintera-api`](../../Elaine/lintera-api) project, with two deliberate deviations: **PascalCase filenames** (consistent with the existing TypeScript files in this project) and **`UseCase` instead of `Service`** for domain business logic classes.

**Scope constraints:**
- Existing `.js` files are not touched unless they are actively being migrated in the current phase.
- Nothing goes dark during migration. Old routes stay alive until a new slice fully replaces them.
- Only new or refactored code must be TypeScript.
- No dependency injection container — manual constructor injection via factory functions.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  HTTP client / external trigger                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  application/                       (primary adapters)          │
│  *Controller.ts  *Validator.ts  *Middleware.ts                  │
│  index.ts (route registration + DI wiring)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ calls
┌───────────────────────────▼─────────────────────────────────────┐
│  domain/                            (pure business logic)       │
│  *.ts (entity)   *UseCase.ts   *Collection.ts (port)            │
│  <context>/value/   <context>/error/                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ depends on port interfaces only
┌───────────────────────────▼─────────────────────────────────────┐
│  infrastructure/                    (secondary adapters)        │
│  Knex*CollectionAdapter.ts  (Knex query builder → Postgres)     │
│  BcryptPasswordHasherAdapter.ts                                 │
│  NodemailerEmailAdapter.ts                                      │
│  ConsoleAdapter.ts                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  library/                           (shared, framework-agnostic)│
│  either/   http/   logger/                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  factory/                           (composition root)          │
│  KnexFactory.ts   *CollectionFactory.ts                         │
└─────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** arrows point inward. `domain/` imports nothing outside itself (and `library/`). `application/` imports from `domain/` and `library/`. `infrastructure/` imports from `domain/` and `library/`. `factory/` imports from all layers.

---

## Directory Layout

New directories are introduced alongside the existing `src/` tree. All existing files remain untouched.

```
src/
├── library/                          # framework-agnostic shared primitives
│   ├── either/
│   │   └── index.ts                  # Either<L, R>, Left, Right
│   ├── http/
│   │   ├── common.ts                 # HttpRequest, HttpResponse, StatusCode, Method
│   │   ├── server.ts                 # Server, RequestHandler, NextHandler interfaces
│   │   └── error/
│   │       ├── HttpError.ts
│   │       ├── BadRequestError.ts
│   │       ├── NotFoundError.ts
│   │       ├── UnauthorizedError.ts
│   │       └── InternalServerError.ts
│   └── logger/
│       └── index.ts                  # Logger interface (already partially exists)
│
├── domain/
│   └── <context>/                    # one folder per bounded context
│       ├── <Noun>.ts                 # aggregate root entity
│       ├── <Noun>Collection.ts       # persistence port interface
│       ├── <Action><Noun>UseCase.ts  # one class per use case
│       ├── value/
│       │   └── <ValueObject>.ts      # value objects for this context
│       └── error/
│           └── <NounError>.ts        # domain-specific errors
│
├── application/
│   └── <context>/
│       ├── index.ts                  # route registration + DI wiring
│       ├── <Action><Noun>Controller.ts
│       ├── <Action><Noun>Validator.ts
│       └── <Name>Middleware.ts
│
├── infrastructure/
│   ├── http/
│   │   └── ExpressServer.ts          # Express implementation of library/http/Server
│   ├── Knex<Noun>CollectionAdapter.ts  # Knex impl of domain port
│   ├── BcryptPasswordHasherAdapter.ts
│   ├── NodemailerEmailAdapter.ts
│   └── ConsoleAdapter.ts             # already exists; move/align
│
└── factory/
    ├── KnexFactory.ts                # singleton Knex instance (replaces src/factories/knex.js)
    ├── <Noun>CollectionFactory.ts    # creates adapter singletons
    └── <Action><Noun>UseCaseFactory.ts
```

> **Note on `infrastructure/http/`:** Express is a secondary concern — it adapts the `library/http/Server` interface. All request/response types used in `application/` come from `library/http/common.ts`, never from Express directly.

> **Note on entity filenames:** Entity files are named after the domain class with no role suffix (e.g., `Familia.ts` contains `class Familia`), because the class name itself is already unambiguous in the domain context folder. All other files include the role in the class name and therefore in the filename.

---

## File Naming Conventions

All filenames are **PascalCase**. The role is embedded in the class name, which is identical to the filename stem.

| Role | Pattern | File example | Class example |
|---|---|---|---|
| Domain entity | `<Noun>.ts` | `Familia.ts` | `class Familia` |
| Persistence port | `<Noun>Collection.ts` | `FamiliaCollection.ts` | `interface FamiliaCollection` |
| Domain use case | `<Action><Noun>UseCase.ts` | `ListaFamiliasUseCase.ts` | `class ListaFamiliasUseCase` |
| Value object | `<Noun>.ts` (inside `value/`) | `value/NomeCientifico.ts` | `class NomeCientifico` |
| Domain error | `<Noun>Error.ts` (inside `error/`) | `error/FamiliaNotFoundError.ts` | `class FamiliaNotFoundError` |
| HTTP controller | `<Action><Noun>Controller.ts` | `ListaFamiliasController.ts` | `class ListaFamiliasController` |
| HTTP validator | `<Action><Noun>Validator.ts` | `CreateFamiliaValidator.ts` | `class CreateFamiliaValidator` |
| HTTP middleware | `<Name>Middleware.ts` | `RequireCuradorMiddleware.ts` | `class RequireCuradorMiddleware` |
| Infrastructure adapter | `<Noun>Collection<Tech>Adapter.ts` | `FamiliaCollectionKnexAdapter.ts` | `class FamiliaCollectionKnexAdapter` |
| Knex singleton factory | `KnexFactory.ts` | `KnexFactory.ts` | `function createKnexInstance` |
| Collection factory | `<Noun>CollectionFactory.ts` | `FamiliaCollectionFactory.ts` | `function createFamiliaCollection` |
| HTTP server adapter | `<Tech>Server.ts` | `ExpressServer.ts` | `class ExpressServer` |
| Library error | `<Noun>Error.ts` | `BadRequestError.ts` | `class BadRequestError` |
| Route index | `index.ts` | `application/taxonomia/index.ts` | — |

**Action verbs** in use case and controller names must be written in **Brazilian Portuguese** (e.g., `Lista`, `Cria`, `Atualiza`, `Deleta`, `Busca`). This is the convention established for this project — _not_ English verbs.

---

## Layer Patterns

### `library/either`

Copied directly from lintera-api. All domain use cases and infrastructure adapters return `Either<Error, T>` instead of throwing.

```typescript
// src/library/either/index.ts
export type Either<L extends Error, R> = Left<L> | Right<R>

export const Either = Object.freeze({
  right<T>(value: T) { return new Right(value) },
  left<T extends Error>(value: T) { return new Left(value) }
})
```

**Incremental adoption rule:** Either is used in all new use cases and adapters from day one. Existing JS controllers do not need to understand Either — the new application-layer controllers handle the unwrapping and map failures to HTTP responses.

---

### `library/enum`

Native TypeScript `enum` declarations are **banned** in this project (ESLint `no-restricted-syntax` rule). Use `const` objects with an `EnumOf` type helper instead. This avoids the runtime overhead, implicit reverse-mapping, and declaration-merging pitfalls of enums while keeping full type safety.

```typescript
// src/library/enum.ts
declare global {
  type EnumOf<T> = T[keyof T]
}
```

Usage pattern:

```typescript
export const Method = {
  Delete: 'delete',
  Get: 'get',
  Post: 'post',
  Put: 'put'
} as const

export type Method = EnumOf<typeof Method>
```

---

### `library/singleton`

A generic helper for creating lazy singletons in factory functions. All `factory/` files use this.

```typescript
// src/library/singleton.ts
export function singleton<T>(factory: () => T): () => T {
  let instance: null | T = null
  return () => {
    if (!instance) {
      instance = factory()
    }
    return instance
  }
}
```

**Rule:** always use the **explicit function body** form (no implicit arrow return) when passing a factory to `singleton`.

---

### `library/http`

Framework-agnostic HTTP primitives. Never import `express` types here. `Method` and `StatusCode` follow the `EnumOf` pattern — no native enums.

```typescript
// src/library/http/common.ts
export const Method = {
  Delete: 'delete',
  Get: 'get',
  Post: 'post',
  Put: 'put'
} as const

export type Method = EnumOf<typeof Method>

export const StatusCode = {
  Ok: 200,
  Created: 201,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableEntity: 422,
  InternalServerError: 500
} as const

export type StatusCode = EnumOf<typeof StatusCode>

export interface HttpRequest<Body = unknown, Params = Record<string, unknown>> {
  method: Method
  path: string
  headers: Headers
  params: Params
  body: Body
}

export interface HttpResponse<Body = unknown> {
  statusCode: StatusCode
  headers?: Headers
  body?: Body
}
```

The `Server` interface exposes `use()` and `mount()` in addition to the endpoint registration methods. This is required so the `Application` class can configure middleware and mount legacy routers without importing Express.

```typescript
// src/library/http/Server.ts
export interface RequestHandler<RequestBody = unknown, ResponseBody = unknown> {
  handle(
    request: HttpRequest<RequestBody>,
    next: NextHandler<ResponseBody>
  ): Promise<HttpResponse<ResponseBody> | HttpError>
}

export interface Server {
  endpoint(method: Method, path: string, ...handlers: RequestHandler[]): this
  use(...args: unknown[]): this
  mount(router: unknown): this
  start(port: number): Promise<void>
  shutdown(): Promise<void>
}
```

---

### `domain/` — Entity

Entities have a **private constructor** and a `static create()` factory that returns `Either`. This enforces invariants at construction time.

```typescript
// src/domain/taxonomia/Familia.ts
import { Either } from '@/library/either'

export interface Attributes {
  id: number
  nome: string
  createdAt: Date
  updatedAt: Date
}

export class Familia {
  readonly id: number
  readonly nome: string
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
    this.createdAt = attributes.createdAt
    this.updatedAt = attributes.updatedAt
  }

  static create(attributes: Attributes): Either<Error, Familia> {
    if (!attributes.nome.trim()) {
      return Either.left(new Error('Nome da família não pode ser vazio'))
    }
    return Either.right(new Familia(attributes))
  }
}
```

---

### `domain/` — Port (Collection)

The term **collection** is used for persistence ports, mirroring lintera-api's convention. The storage technology (Sequelize, raw SQL) is irrelevant to the domain — it is hidden behind this interface.

```typescript
// src/domain/taxonomia/FamiliaCollection.ts
import { Either } from '@/library/either'
import { Attributes } from './Familia'

export interface FamiliaFilters {
  nome?: string
  page?: number
  perPage?: number
}

export interface FamiliaCollection {
  findAll(filters: FamiliaFilters): Promise<Either<Error, Attributes[]>>
  findById(params: { id: number }): Promise<Either<Error, Attributes | null>>
  save(params: { familia: Attributes }): Promise<Either<Error, Attributes>>
  delete(params: { id: number }): Promise<Either<Error, void>>
}
```

---

### `domain/` — Use Case

One class per use case. Dependencies injected via a `Dependencies` interface. The class name and filename both carry the action and the role (`UseCase`).

```typescript
// src/domain/taxonomia/ListaFamiliasUseCase.ts
import { Either } from '@/library/either/Either'
import { Attributes } from './Familia'
import { FamiliaCollection, FamiliaFilters } from './FamiliaCollection'

interface Dependencies {
  familiaCollection: FamiliaCollection
}

export class ListaFamiliasUseCase {
  private readonly familiaCollection: FamiliaCollection

  constructor(dependencies: Dependencies) {
    this.familiaCollection = dependencies.familiaCollection
  }

  execute(filters: FamiliaFilters): Promise<Either<Error, Attributes[]>> {
    return this.familiaCollection.findAll(filters)
  }
}
```

---

### `infrastructure/` — Adapter

Implements the domain port using Knex as a query builder against Postgres. Returns `Either` — never throws. The domain layer has no knowledge of Knex or SQL.

**Naming:** `<Noun>Collection<Tech>Adapter.ts` — the technology comes last (e.g., `FamiliaCollectionKnexAdapter.ts`).

**Knex conventions:**
- `.select()` always uses the **array form** for multiple columns: `.select(['id', 'nome'])`.
- Use a **typed record** for the Knex generic when the DB row shape differs from the domain `Attributes` (e.g., DB foreign key columns that are not part of the domain interface).
- Conditional `where` clauses are applied only when the filter value is defined.

```typescript
// src/infrastructure/FamiliaCollectionKnexAdapter.ts
import { Knex } from 'knex'
import { FamiliaCollection, FamiliaFilters } from '@/domain/taxonomia/FamiliaCollection'
import { Attributes } from '@/domain/taxonomia/Familia'
import { Either } from '@/library/either/Either'
import { CollectionError } from './error/CollectionError'

interface Dependencies {
  knex: Knex
}

export class FamiliaCollectionKnexAdapter implements FamiliaCollection {
  private readonly knex: Knex

  constructor(dependencies: Dependencies) {
    this.knex = dependencies.knex
  }

  async findAll(filters: FamiliaFilters): Promise<Either<Error, Attributes[]>> {
    try {
      const query = this.knex<Attributes>('familias')
        .select(['id', 'nome'])
        .orderBy('nome')

      if (filters.nome) {
        query.whereILike('nome', `%${filters.nome}%`)
      }

      return Either.right(await query)
    } catch (error) {
      return Either.left(
        new CollectionError({ message: 'Failed to list familias', cause: error })
      )
    }
  }
}
```

For PostGIS queries or anything the builder cannot express cleanly, use `this.knex.raw(sql, bindings)`.

---

### `application/` — Controller

Controllers are thin adapters. They parse the HTTP request, call the domain use case, unwrap the `Either`, and map the result to an `HttpResponse`.

**Path parameter naming:** all route path parameters must be **camelCase** (e.g., `:familiaId`, `:paisSigla`). Never use snake_case in route definitions.

```typescript
// src/application/taxonomia/ListaFamiliasController.ts
import { ListaFamiliasUseCase } from '@/domain/taxonomia/ListaFamiliasUseCase'
import { HttpRequest, HttpResponse, StatusCode } from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaFamiliasUseCase: ListaFamiliasUseCase
}

export class ListaFamiliasController implements RequestHandler {
  private readonly listaFamiliasUseCase: ListaFamiliasUseCase

  constructor(dependencies: Dependencies) {
    this.listaFamiliasUseCase = dependencies.listaFamiliasUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const result = await this.listaFamiliasUseCase.execute({
      nome: request.params.nome as string | undefined
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
```

---

### `application/` — Route Index (DI wiring)

Each context's `index.ts` instantiates adapters, use cases, and controllers, then exports a `routes` array conforming to the `Route` type defined in `Application.ts`. This is the composition root for the context.

```typescript
// src/application/taxonomia/index.ts
import { ListaFamiliasUseCase } from '@/domain/taxonomia/ListaFamiliasUseCase'
import { createFamiliaCollection } from '@/factory/FamiliaCollectionFactory'
import { Method } from '@/library/http/common'

import { Route } from '../Application'
import { ListaFamiliasController } from './ListaFamiliasController'

const familiaCollection = createFamiliaCollection()

export const routes: Route[] = [
  {
    method: Method.Get,
    path: '/taxonomias/familias',
    handlers: [
      new ListaFamiliasController({
        listaFamiliasUseCase: new ListaFamiliasUseCase({ familiaCollection })
      })
    ]
  }
]
```

---

### `factory/` — Shared Singletons

`KnexFactory.ts` is the single source of truth for the app's Knex connection. It replaces the legacy `src/factories/knex.js` (which had the wrong `mysql2` client). All collection factories import from it.

All factories use the `singleton` helper from `@/library/singleton`. Always use an **explicit function body** (not an implicit arrow return) inside `singleton()`.

```typescript
// src/factory/KnexFactory.ts
import createKnex, { Knex } from 'knex'
import { singleton } from '@/library/singleton'

const {
  PG_DATABASE, PG_HOST, PG_PASSWORD, PG_PORT = '5432', PG_USERNAME
} = process.env

export const createKnexInstance = singleton((): Knex => {
  return createKnex({
    client: 'postgres',
    connection: {
      database: PG_DATABASE,
      host: PG_HOST,
      password: PG_PASSWORD,
      port: parseInt(PG_PORT),
      user: PG_USERNAME
    },
    pool: { max: 25, min: 2 }
  })
})
```

Collection factories wrap the adapter with the shared Knex instance:

```typescript
// src/factory/FamiliaCollectionFactory.ts
import { FamiliaCollectionKnexAdapter } from '@/infrastructure/FamiliaCollectionKnexAdapter'
import { singleton } from '@/library/singleton'
import { createKnexInstance } from './KnexFactory'

export const createFamiliaCollection = singleton(() => {
  return new FamiliaCollectionKnexAdapter({ knex: createKnexInstance() })
})
```

### `application/Application.ts` — Bootstrap

The `Application` class is the single place that configures all middleware and assembles all routes. It receives a `Server`, a list of `Route` objects (from new context `index.ts` files), and the legacy Express router as a fallback mount. New routes are registered first and always take precedence.

```typescript
export interface Route {
  method: Method
  path: string
  handlers: RequestHandler[]
}

interface Parameters {
  server: Server
  routes: Route[]
  legacyRouter?: unknown
  cors: { origins: string[]; methods: string[]; allowedHeaders: string[] }
}

export class Application {
  constructor(parameters: Parameters) { ... }

  async start(port: number): Promise<void> { ... }
}
```

The composition root (`src/application/index.ts`) creates the `Application`, passes all context `routes` arrays, and calls `application.start(port)`.

---

## Reference Implementation: Taxonomias Domain

**Chosen as the first slice** because it is data-centric, has no significant side effects, and covers a representative set of CRUD patterns.

**Entities in scope:** `Familia`, `Genero`, `Especie`, `Subespecie`, `Variedade`.

**Sequencing within the slice:**

1. `Familia` — simplest entity, no foreign-key dependencies within taxonomia.
2. `Genero` — depends on `Familia`.
3. `Especie` — depends on `Genero`.
4. `Subespecie` and `Variedade` — depend on `Especie`.

**For each entity, the deliverables are:**

| File | Location |
|---|---|
| `<Noun>.ts` | `src/domain/taxonomia/` |
| `<Noun>Collection.ts` | `src/domain/taxonomia/` |
| `Lista<Noun>sUseCase.ts` | `src/domain/taxonomia/` |
| `Busca<Noun>UseCase.ts` | `src/domain/taxonomia/` |
| `Cria<Noun>UseCase.ts` | `src/domain/taxonomia/` |
| `Atualiza<Noun>UseCase.ts` | `src/domain/taxonomia/` |
| `Deleta<Noun>UseCase.ts` | `src/domain/taxonomia/` |
| `<Noun>CollectionKnexAdapter.ts` | `src/infrastructure/` |
| `Lista<Noun>sController.ts` | `src/application/taxonomia/` |
| `Busca<Noun>Controller.ts` | `src/application/taxonomia/` |
| `Cria<Noun>Controller.ts` | `src/application/taxonomia/` |
| `Atualiza<Noun>Controller.ts` | `src/application/taxonomia/` |
| `Deleta<Noun>Controller.ts` | `src/application/taxonomia/` |
| `Cria<Noun>Validator.ts` | `src/application/taxonomia/` |
| `Atualiza<Noun>Validator.ts` | `src/application/taxonomia/` |
| `index.ts` (routes + wiring) | `src/application/taxonomia/` |

**Existing files deprecated alongside:**
- `src/controllers/taxonomias-controller.js`
- `src/routes/taxonomias-routes.js`
- `src/validators/taxonomias/` (all files)

These are not deleted until Phase 1 is complete and the new routes are verified in production.

---

## Testing Strategy

Tests mirror the `src/` structure under `test/`.

### Unit tests — `test/domain/`

Test domain use cases with **in-memory mock implementations** of the port interface. No database, no Express, no network.

```typescript
// test/domain/taxonomia/ListaFamiliasUseCase.test.ts
import { describe, expect, test, vi } from 'vitest'
import { ListaFamiliasUseCase } from '@/domain/taxonomia/ListaFamiliasUseCase'
import { Either } from '@/library/either/Either'

describe('ListaFamiliasUseCase', () => {
  test('returns familias from the collection', async () => {
    const mockCollection = {
      findAll: vi.fn().mockResolvedValue(Either.right([{ id: 1, nome: 'Orchidaceae' }]))
    }
    const useCase = new ListaFamiliasUseCase({ familiaCollection: mockCollection })
    const result = await useCase.execute({})

    expect(result.right()).toBe(true)
    expect(result.value).toHaveLength(1)
  })
})
```

### Integration tests — `test/infrastructure/`

Knex adapter tests use **Knex builder stubs** — a `vi.fn()` that returns a chainable builder mock. This allows testing the SQL logic (which columns are selected, which `where` clauses are applied) without a real database connection. A real-DB test suite can be added later.

```typescript
// test/infrastructure/FamiliaCollectionKnexAdapter.test.ts
function stubKnex<TResult>(promise: Promise<TResult>) {
  const builder = {} as Record<string, unknown>
  builder.select = vi.fn().mockImplementation(() => builder)
  builder.where = vi.fn().mockImplementation(() => builder)
  builder.orderBy = vi.fn().mockImplementation(() => builder)
  builder.then = (onResolved, onRejected) => promise.then(onResolved, onRejected)

  const knex = vi.fn(() => builder) as unknown as Knex & { builder: typeof builder }
  knex.builder = builder
  return knex
}
```

### Unit tests — `test/application/`

Controller tests mock the use case and verify HTTP response mapping — status codes, body shape, error paths, and validation of required params.

### Rules

- Domain use case tests must never instantiate Express, Knex, or any external library.
- Infrastructure adapter tests use the Knex stub pattern; no real database is required.
- Controller tests mock the use case; they must not instantiate any infrastructure dependency.
- Vitest `include` pattern in `vitest.config.mts` already covers `test/**/*.test.ts` — no config changes needed.

---

## Milestones & Issues

Each milestone can be worked on independently once its dependency is complete. Issues within a milestone are designed to be delegated to individual developers.

---

### Milestone 0 — Foundation ✅ *COMPLETE*

| # | Issue | Status | Files |
|---|---|---|---|
| 0.1 | **`library/either`** | ✅ Done | `src/library/either/Either.ts` |
| 0.2 | **`library/http` primitives** | ✅ Done | `src/library/http/common.ts`, `Server.ts`, `error/` |
| 0.3 | **`library/enum` + `library/singleton`** | ✅ Done | `src/library/enum.ts`, `src/library/singleton.ts` |
| 0.4 | **`ExpressServer` adapter** | ✅ Done | `src/infrastructure/ExpressServer.ts` |
| 0.5 | **`Application` bootstrap class** | ✅ Done | `src/application/Application.ts`, `src/application/index.ts` |
| 0.6 | **`KnexFactory`** | ✅ Done | `src/factory/KnexFactory.ts` |
| 0.7 | **`ConsoleLogger`** | ✅ Done | `src/infrastructure/ConsoleLogger.ts` |

---

### Milestone 1 — Países & Estados ✅ *COMPLETE*

**The reference implementation.** Read-only (2 GET endpoints). Every other milestone follows this pattern.

**Endpoints implemented:**
- `GET /paises` — list all countries with optional `?nome=` filter
- `GET /paises/:paisSigla/estados` — list states belonging to a country

**Architecture decisions made during this milestone:**
- `Estado` lives in its **own domain context** (`src/domain/estado/`) — never nested under `pais`.
- `EstadoCollection` has a single `findAll(filters: EstadoFilters)` method; `paisSigla` is passed inside `filters`, not as a top-level argument.
- The `pais` collection port (`PaisCollection`) only handles `paises` queries — it does not know about `estados`.
- Path params use **camelCase** in the route definition (`:paisSigla`, not `:pais_sigla`).

| # | Issue | Status | Files |
|---|---|---|---|
| 1.1 | **Pais entity + collection port** | ✅ Done | `src/domain/pais/Pais.ts`, `PaisCollection.ts` |
| 1.2 | **Pais use case** | ✅ Done | `src/domain/pais/ListaPaisesUseCase.ts` |
| 1.3 | **Pais Knex adapter + factory** | ✅ Done | `src/infrastructure/PaisCollectionKnexAdapter.ts`, `src/factory/PaisCollectionFactory.ts` |
| 1.4 | **Pais controller + route index** | ✅ Done | `src/application/pais/ListaPaisesController.ts`, `src/application/pais/index.ts` |
| 1.5 | **Estado entity + collection port** | ✅ Done | `src/domain/estado/Estado.ts`, `EstadoCollection.ts` |
| 1.6 | **Estado use case** | ✅ Done | `src/domain/estado/ListaEstadosUseCase.ts` |
| 1.7 | **Estado Knex adapter + factory** | ✅ Done | `src/infrastructure/EstadoCollectionKnexAdapter.ts`, `src/factory/EstadoCollectionFactory.ts` |
| 1.8 | **Estado controller + route index** | ✅ Done | `src/application/estado/ListaEstadosController.ts`, `src/application/estado/index.ts` |
| 1.9 | **Unit + integration tests** | ✅ Done | `test/domain/pais/`, `test/domain/estado/`, `test/infrastructure/Pais*`, `test/infrastructure/Estado*`, `test/application/pais/`, `test/application/estado/` |
| 1.10 | **Deprecate old Pais/Estado files** | ⏳ Pending | `src/controllers/paises-controller.js`, `src/routes/paises.js` |

---

### Milestone 2 — Taxonomias

One issue per entity. Each can be delegated independently once Milestone 0 is complete.
Entities must be migrated in order due to foreign key dependencies: Familia → Genero → Especie → Subespecie / Variedade.

| # | Issue | Depends on | Endpoints |
|---|---|---|---|
| 2.1 | **Familia** | M0 | `GET /familias`, `GET /familias/:familiaId`, `POST /familias`, `PUT /familias/:familiaId`, `DELETE /familias/:familiaId` |
| 2.2 | **Genero** | 2.1 | Same CRUD pattern |
| 2.3 | **Especie** | 2.2 | Same CRUD pattern |
| 2.4 | **Subespecie** | 2.3 | Same CRUD pattern |
| 2.5 | **Variedade** | 2.3 | Same CRUD pattern |

For each entity the deliverables are: entity, collection port, use cases (`Lista`, `Busca`, `Cria`, `Atualiza`, `Deleta`), Knex adapter, collection factory, controllers, validators (`Cria`, `Atualiza`), route `index.ts`, unit tests, Knex-stub integration tests, deprecation of old files.

---

### Milestone 3 — Localização

Location hierarchy: País → Estado → Cidade → LocalColeta. País and Estado are done in M1.

| # | Issue | Depends on |
|---|---|---|
| 3.1 | **Estado** | ✅ Done in M1 |
| 3.2 | **Cidade** | M1 |
| 3.3 | **LocalColeta** | 3.2 |

---

### Milestone 4 — Herbário & Coletor

| # | Issue | Depends on |
|---|---|---|
| 4.1 | **Herbario** | M0 |
| 4.2 | **Coletor** | M0 |
| 4.3 | **Identificador** | M0 |

---

### Milestone 5 — Usuários & Auth

Higher complexity due to JWT, bcrypt, and role-based middleware.

| # | Issue | Description |
|---|---|---|
| 5.1 | **User entity + collection port** | Entity with hashed password; `UsuarioCollection` port |
| 5.2 | **Auth use cases** | `RegisterUsuarioUseCase`, `AuthenticateUsuarioUseCase`, `ChangePasswordUseCase` |
| 5.3 | **Bcrypt adapter** | `BcryptPasswordHasherAdapter` implementing a `PasswordHasher` port |
| 5.4 | **JWT adapter** | `JwtTokenServiceAdapter` implementing a `TokenService` port |
| 5.5 | **Auth middleware** | `RequireAuthMiddleware`, `RequireCuradorMiddleware`, `RequireOperadorMiddleware` |
| 5.6 | **Controllers + route index** | Login, register, profile, change password |

---

### Milestone 6 — Tombos *(core specimen domain)*

Largest and most complex migration (~2000-line controller). Split into logical groups so multiple developers can work in parallel on the same domain once the entity and port are defined.

| # | Issue | Description |
|---|---|---|
| 6.1 | **Tombo entity + collection port** | Define the full `TomboCollection` interface with all query signatures before any implementation starts |
| 6.2 | **Sequelize Tombo adapter** | Implement `TomboCollection` using existing Sequelize models and raw queries |
| 6.3 | **List & search tombos** | Listing with filters (taxa, location, date range, collector, etc.) |
| 6.4 | **Create tombo** | Full creation flow including related records |
| 6.5 | **Update tombo** | Update flow; partial updates |
| 6.6 | **Delete tombo** | Soft delete or hard delete depending on current behavior |
| 6.7 | **Tombo photos** | Upload, list, delete photos (`TomboFoto`) |
| 6.8 | **Tombo identification** | Identification status and history |
| 6.9 | **Darwin Core export** | CSV/JSON export endpoint |

---

### Milestone 7 — Deprecated Library Cleanup *(independent track)*

Can be started in parallel with any milestone. Does not block domain migrations.

| # | Issue | Replacement | Affected area |
|---|---|---|---|
| 7.1 | Replace `request` with `axios` | `axios` (already installed) | `src/herbarium/reflora/`, `src/herbarium/specieslink/` |
| 7.2 | Replace `q` with `async/await` | Native promises | `src/herbarium/` |
| 7.3 | Consolidate date library | Remove `moment` + `moment-timezone`; keep `date-fns` | Scattered |
| 7.4 | Remove MySQL remnants | Remove `mysql2`; delete `src/factories/knex.js` (replaced by `src/factory/KnexFactory.ts`) | `package.json`, `.env.example`, `src/factories/knex.js` |
| 7.5 | Fix Babel target | `Node 22` | `.babelrc` |

---

## Invariants and Rules

These must never be broken regardless of phase:

- `domain/` files must have **zero imports** from `express`, `knex`, `sequelize`, `axios`, `nodemailer`, or any other third-party library. Only `@/library/` imports are allowed.
- `application/` files must have **zero imports** from `express` directly. All HTTP types come from `@/library/http/`.
- Every domain use case and infrastructure adapter **returns `Either`** — never throws for expected failure cases.
- Every new file is **TypeScript**. No new `.js` files.
- Existing `.js` files are only modified when actively migrating that file's domain in the current phase.
- Controllers must be **thin**: no business logic, no direct database calls. If a controller grows beyond ~40 lines, that is a signal that logic belongs in a use case.
- **No native TypeScript `enum` declarations.** Use `const` objects with the `EnumOf<typeof ...>` type helper instead. The ESLint `no-restricted-syntax` rule enforces this with a warning.
- **Route path parameters must be camelCase** (e.g., `:paisSigla`, `:familiaId`). Never snake_case in route definitions.
- **Knex `.select()` must always use the array form** when selecting multiple columns: `.select(['col1', 'col2'])`.
- **Factory functions use the `singleton` helper** from `@/library/singleton` with an explicit function body — not an implicit arrow return.
- **Each domain context is independent**: a domain folder (e.g., `estado/`) must not reference another domain's types or interfaces directly. Cross-domain relationships are expressed through foreign-key filters in the collection port's `Filters` interface, not by importing the parent domain.
- **`@stylistic/operator-linebreak`:** binary operators break _before_ the operator, except `=` which breaks _after_ (i.e., the value starts on the next line).
- **`@stylistic/quote-props`:** object property quotes are only allowed when syntactically required (`as-needed`).
