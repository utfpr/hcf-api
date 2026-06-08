import { config } from 'dotenv'
import createKnex from 'knex'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApplyMigrationService } from '@/database/apply-migration-service'
import { MigrationFileSystem } from '@/database/migration-file-system'
import { MigrationRepository } from '@/database/migration-repository'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'

import { bootstrapTestSchema } from './bootstrap-schema'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

function loadTestEnv(): void {
  config({ path: path.join(projectRoot, '.env.test') })
  if (process.env.TEST_DB_MODE === undefined) {
    process.env.TEST_DB_MODE = 'docker'
  }
}

function spawnAndWait(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

async function waitForDatabase(maxAttempts = 30, intervalMs = 1000): Promise<void> {
  const {
    PG_DATABASE,
    PG_HOST,
    PG_PORT = '5432',
    PG_MIGRATION_USERNAME,
    PG_MIGRATION_PASSWORD
  } = process.env

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
      await knex.destroy()
      return
    } catch {
      await knex.destroy().catch(() => undefined)
      if (attempt === maxAttempts) {
        throw new Error(`Database not ready after ${maxAttempts} attempts`)
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }
}

function createMigrationKnex() {
  const {
    PG_DATABASE,
    PG_HOST,
    PG_PORT = '5432',
    PG_MIGRATION_USERNAME,
    PG_MIGRATION_PASSWORD
  } = process.env

  return createKnex({
    client: 'postgres',
    connection: {
      database: PG_DATABASE,
      host: PG_HOST,
      port: parseInt(PG_PORT, 10),
      user: PG_MIGRATION_USERNAME,
      password: PG_MIGRATION_PASSWORD,
      multipleStatements: true
    }
  })
}

async function runMigrations(): Promise<void> {
  const migrationKnex = createMigrationKnex()
  const logger = new ConsoleLogger()
  const migrationFileSystem = new MigrationFileSystem({
    knex: migrationKnex,
    migrationsPath: path.join(projectRoot, 'src/database/migration')
  })
  const migrationRepository = new MigrationRepository({
    knex: migrationKnex,
    tableName: 'migrations',
    logger
  })

  const applyMigrationService = new ApplyMigrationService({
    migrationFileSystem,
    migrationRepository,
    logger
  })

  try {
    await applyMigrationService.execute()
  } finally {
    await migrationKnex.destroy()
  }
}

async function prepareDatabase(): Promise<void> {
  const migrationKnex = createMigrationKnex()
  try {
    if (process.env.TEST_DB_MODE === 'external') {
      await runMigrations()
      return
    }

    await bootstrapTestSchema(migrationKnex)
  } finally {
    await migrationKnex.destroy()
  }
}

export async function setup(): Promise<void> {
  loadTestEnv()

  if (process.env.TEST_DB_MODE !== 'external') {
    await spawnAndWait('docker', [
      'compose',
      '-f',
      'docker-compose.test.yml',
      'up',
      '-d'
    ])
  }

  await waitForDatabase()
  await prepareDatabase()
}

export async function teardown(): Promise<void> {
  if (process.env.TEST_DB_MODE !== 'external') {
    await spawnAndWait('docker', [
      'compose',
      '-f',
      'docker-compose.test.yml',
      'down'
    ])
  }
}
