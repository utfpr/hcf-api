import createKnex from 'knex'
import { loadEnvFile } from 'node:process'

loadEnvFile('.env')

async function assertDatabaseReachable(): Promise<void> {
  const {
    PG_DATABASE,
    PG_HOST,
    PG_PORT = '5432',
    PG_MIGRATION_USERNAME,
    PG_MIGRATION_PASSWORD
  } = process.env

  const knex = createKnex({
    client: 'postgres',
    connection: {
      database: PG_DATABASE,
      host: PG_HOST,
      port: parseInt(PG_PORT, 10),
      user: PG_MIGRATION_USERNAME,
      password: PG_MIGRATION_PASSWORD
    }
  })

  try {
    await knex.raw('SELECT 1')
  } catch {
    throw new Error(
      `Cannot connect to the test database (${PG_HOST}:${PG_PORT}/${PG_DATABASE}). `
      + 'Start the container and apply migrations before running tests — '
      + 'see test/integration/README.md'
    )
  } finally {
    await knex.destroy().catch(() => undefined)
  }
}

export async function setup(): Promise<void> {
  await assertDatabaseReachable()
}

export async function teardown(): Promise<void> {
  // Container lifecycle is managed by the developer — see test/integration/README.md
}
