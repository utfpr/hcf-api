import path from 'node:path'

import { CorruptedDirectoryError } from './errors/corrupted-directory-error'
import { MigrationDataSource } from './migration-data-source'
import { MigrationFileSystem } from './migration-file-system'

interface Dependencies {
  migrationFileSystem: MigrationFileSystem
  migrationDataSource: MigrationDataSource
}

export class ApplyMigrationService {

  private readonly migrationFileSystem: MigrationFileSystem
  private readonly migrationDataSource: MigrationDataSource

  constructor(readonly dependencies: Dependencies) {
    this.migrationFileSystem = dependencies.migrationFileSystem
    this.migrationDataSource = dependencies.migrationDataSource
  }

  async execute() {
    const migrationFilePaths = await this.migrationFileSystem.listMigrationFiles()
    const migrationFileNames = migrationFilePaths.map(file => path.basename(file, '.sql'))

    await this.migrationDataSource.ensureMigrationTableExists()
    const appliedMigrations = await this.migrationDataSource.getAppliedMigrations()

    const missingMigrations = appliedMigrations.filter(appliedMigration => !migrationFileNames.includes(appliedMigration.name))
    if (missingMigrations.length) {
      const missingMigrationsNames = missingMigrations.map(migration => migration.name)
      throw new CorruptedDirectoryError('The migration directory is missing some files', missingMigrationsNames)
    }

    const unappliedMigrations = migrationFileNames
      .filter(migrationFileName => !appliedMigrations.some(appliedMigration => appliedMigration.name === migrationFileName))

    if (!unappliedMigrations.length) {
      console.warn('No pending migrations to apply')
      return
    }

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const migrationFileName of unappliedMigrations) {
      const migrationFileContent = await this.migrationFileSystem.getMigrationFileContent(migrationFileName)
      await this.migrationDataSource.applyMigration(migrationFileName, migrationFileContent)
    }
    /* eslint-enable no-restricted-syntax */
  }

}
