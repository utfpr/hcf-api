import createKnex, { Knex } from 'knex'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env.test')
} catch {
  // In CI, environment variables are injected directly into the process
}

const TABLES = [
  'estados',
  'paises'
]

async function truncateTables(knex: Knex): Promise<void> {
  await knex.raw(`TRUNCATE TABLE ${TABLES.join(', ')} CASCADE`)
}

export async function setup(): Promise<void> {
  const {
    PG_DATABASE,
    PG_HOST,
    PG_PORT = '5432',
    PG_USERNAME,
    PG_PASSWORD
  } = process.env

  const knex = createKnex({
    client: 'postgres',
    connection: {
      database: PG_DATABASE,
      host: PG_HOST,
      port: parseInt(PG_PORT, 10),
      user: PG_USERNAME,
      password: PG_PASSWORD
    }
  })

  try {
    await knex.raw('SELECT 1')
    await truncateTables(knex)
  } catch {
    throw new Error(
      `Cannot connect to the test database (${PG_HOST}:${PG_PORT}/${PG_DATABASE}). `
      + 'Start the container and apply the schema before running e2e tests — '
      + 'see test/e2e/README.md'
    )
  } finally {
    await knex.destroy().catch(() => undefined)
  }
}

export async function teardown(): Promise<void> {
  // Container lifecycle is managed by the developer — see test/e2e/README.md
}
