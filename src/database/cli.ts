import { program } from 'commander'
import createKnex from 'knex'
import path from 'node:path'

import { ApplyMigrationService } from './apply-migration-service'
import { CreateMigrationService } from './create-migration-service'
import { MigrationFileSystem } from './migration-file-system'
import { MigrationRepository } from './migration-repository'

const {
  MYSQL_DATABASE,
  MYSQL_HOST,
  MYSQL_PORT = '3306',
  MYSQL_MIGRATION_USERNAME,
  MYSQL_MIGRATION_PASSWORD
} = process.env

const migrationKnex = createKnex({
  client: 'mysql2',
  connection: {
    database: MYSQL_DATABASE,
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT),
    user: MYSQL_MIGRATION_USERNAME,
    password: MYSQL_MIGRATION_PASSWORD,
    multipleStatements: true
  }
})

const migrationFileSystem = new MigrationFileSystem({ knex: migrationKnex, migrationsPath: path.join(__dirname, 'migrations') })
const migrationDataSource = new MigrationRepository({ knex: migrationKnex, tableName: 'migrations' })

async function createMigration(name: string) {
  const createMigrationService = new CreateMigrationService({ migrationFileSystem })
  await createMigrationService.execute(name)
}

async function applyMigrations() {
  const applyMigrationsService = new ApplyMigrationService({ migrationFileSystem, migrationRepository: migrationDataSource })
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
