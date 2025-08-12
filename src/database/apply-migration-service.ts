import path from 'node:path'

import { CorruptedDirectoryError } from './errors/corrupted-directory-error'
import { MigrationFileSystem } from './migration-file-system'
import { MigrationRepository } from './migration-repository'

interface Dependencies {
  migrationFileSystem: MigrationFileSystem
  migrationRepository: MigrationRepository
}

export class ApplyMigrationService {

  private readonly migrationFileSystem: MigrationFileSystem
  private readonly migrationRepository: MigrationRepository

  constructor(readonly dependencies: Dependencies) {
    this.migrationFileSystem = dependencies.migrationFileSystem
    this.migrationRepository = dependencies.migrationRepository
  }

  async execute() {
    const migrationFilePaths = await this.migrationFileSystem.listMigrationFiles()
    const migrationNames = migrationFilePaths.map(file => path.basename(file, path.extname(file)))

    await this.migrationRepository.ensureMigrationTableExists()
    const appliedMigrations = await this.migrationRepository.getAppliedMigrations()

    const missingMigrations = appliedMigrations.filter(appliedMigration => !migrationNames.includes(appliedMigration.name))
    if (missingMigrations.length) {
      const missingMigrationsNames = missingMigrations.map(migration => migration.name)
      throw new CorruptedDirectoryError('The migration directory is missing some files', missingMigrationsNames)
    }

    const unappliedMigrations = migrationNames
      .filter(migrationFileName => !appliedMigrations.some(appliedMigration => appliedMigration.name === migrationFileName))

    if (!unappliedMigrations.length) {
      console.warn('No pending migrations to apply')
      return
    }

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const migrationName of unappliedMigrations) {
      try {
        await this.migrationFileSystem.runMigrationFile(migrationName)
        await this.migrationRepository.applyMigration(migrationName)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error applying migration ${migrationName}`, error)
        throw error
      }
    }
    /* eslint-enable no-restricted-syntax */
  }

}
