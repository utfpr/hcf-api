import { program } from 'commander'
import createKnex from 'knex'
import path from 'node:path'

import { ConsoleLogger } from '@/infrastructure/logger'

import { ApplyMigrationService } from './apply-migration-service'
import { CreateMigrationService } from './create-migration-service'
import { MigrationFileSystem } from './migration-file-system'
import { MigrationRepository } from './migration-repository'

const {
  PG_DATABASE,
  PG_HOST,
  PG_PORT = '5432',
  PG_MIGRATION_USERNAME,
  PG_MIGRATION_PASSWORD
} = process.env

const migrationKnex = createKnex({
  client: 'postgres',
  connection: {
    database: PG_DATABASE,
    host: PG_HOST,
    port: parseInt(PG_PORT),
    user: PG_MIGRATION_USERNAME,
    password: PG_MIGRATION_PASSWORD,
    multipleStatements: true
  }
})

const logger = new ConsoleLogger()

const migrationFileSystem = new MigrationFileSystem({ knex: migrationKnex, migrationsPath: path.join(__dirname, 'migration') })
const migrationDataSource = new MigrationRepository({
  knex: migrationKnex, tableName: 'migrations', logger
})

function createMigration(name: string) {
  const createMigrationService = new CreateMigrationService({ migrationFileSystem })
  createMigrationService.execute(name)
}

async function applyMigrations() {
  const applyMigrationsService = new ApplyMigrationService({
    migrationFileSystem, migrationRepository: migrationDataSource, logger
  })
  await applyMigrationsService.execute()
  await migrationKnex.destroy()
}

program
  .command('migration:create')
  .argument('<name>', 'The name of the migration')
  .action(createMigration)

program.command('migration:apply')
  .action(applyMigrations)

program.parse(process.argv)
