import path from 'node:path'

import { Logger } from '@/library/logger'

import { CorruptedDirectoryError } from './error/corrupted-directory-error'
import { MigrationFileSystem } from './migration-file-system'
import { MigrationRepository } from './migration-repository'

interface Dependencies {
  migrationFileSystem: MigrationFileSystem
  migrationRepository: MigrationRepository
  logger: Logger
}

export class ApplyMigrationService {
  private readonly migrationFileSystem: MigrationFileSystem
  private readonly migrationRepository: MigrationRepository
  private readonly logger: Logger

  constructor(readonly dependencies: Dependencies) {
    this.migrationFileSystem = dependencies.migrationFileSystem
    this.migrationRepository = dependencies.migrationRepository
    this.logger = dependencies.logger
  }

  async execute() {
    const migrationFilePaths = this.migrationFileSystem.listMigrationFiles()
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
      this.logger.warn('No pending migrations to apply')
      return
    }

    for (const migrationName of unappliedMigrations) {
      try {
        await this.migrationFileSystem.runMigrationFile(migrationName)
        await this.migrationRepository.applyMigration(migrationName)
      } catch (error) {
        this.logger.error(`Error applying migration ${migrationName}`, error)
        throw error
      }
    }
  }
}
