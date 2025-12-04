import {
  vi, describe, expect, test
} from 'vitest'

import { ApplyMigrationService } from '@/database/apply-migration-service'
import { MigrationFileSystem } from '@/database/migration-file-system'
import { MigrationRepository } from '@/database/migration-repository'
import { Logger } from '@/library/logger'

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

describe('Database > Apply Migration Service', () => {
  test('should apply all migrations', async () => {
    // arrange
    const migrationFileSystem = {
      listMigrationFiles: vi.fn().mockReturnValue([
        'test/database/migrations/20250812025617_test1.ts',
        'test/database/migrations/20250812025618_test2.ts'
      ]),
      runMigrationFile: vi.fn()
    } as unknown as MigrationFileSystem
    const migrationRepository = {
      ensureMigrationTableExists: vi.fn(),
      getAppliedMigrations: vi.fn().mockResolvedValue([{ name: '20250812025617_test1', applied_at: new Date() }]),
      applyMigration: vi.fn()
    } as unknown as MigrationRepository

    const applyMigrationService = new ApplyMigrationService({
      migrationFileSystem, migrationRepository, logger
    })

    // act
    await applyMigrationService.execute()

    // assert
    expect(migrationFileSystem.listMigrationFiles).toHaveBeenCalled()
    expect(migrationRepository.getAppliedMigrations).toHaveBeenCalled()
    expect(migrationFileSystem.runMigrationFile).toHaveBeenCalledWith('20250812025618_test2')
    expect(migrationRepository.applyMigration).toHaveBeenCalledWith('20250812025618_test2')
  })

  test('should not run a migration if it has already been applied', async () => {
    // arrange
    const migrationFileSystem = {
      listMigrationFiles: vi.fn().mockReturnValue(['test/database/migrations/20250812025617_test1.ts']),
      runMigrationFile: vi.fn()
    } as unknown as MigrationFileSystem
    const migrationRepository = {
      ensureMigrationTableExists: vi.fn(),
      getAppliedMigrations: vi.fn().mockResolvedValue([{ name: '20250812025617_test1', applied_at: new Date() }]),
      applyMigration: vi.fn()
    } as unknown as MigrationRepository

    const applyMigrationService = new ApplyMigrationService({
      migrationFileSystem, migrationRepository, logger
    })

    // act
    await applyMigrationService.execute()

    // assert
    expect(migrationFileSystem.listMigrationFiles).toHaveBeenCalled()
    expect(migrationRepository.getAppliedMigrations).toHaveBeenCalled()
    expect(migrationFileSystem.runMigrationFile).not.toHaveBeenCalled()
    expect(migrationRepository.applyMigration).not.toHaveBeenCalled()
  })

  test('should throw an error if the migration file does not exist', async () => {
    // arrange
    const migrationFileSystem = {
      listMigrationFiles: vi.fn().mockReturnValue(['test/database/migrations/20250812025617_test1.ts']),
      runMigrationFile: vi.fn().mockRejectedValue(new Error('Migration file not found'))
    } as unknown as MigrationFileSystem
    const migrationRepository = {
      ensureMigrationTableExists: vi.fn(),
      getAppliedMigrations: vi.fn().mockResolvedValue([]),
      applyMigration: vi.fn()
    } as unknown as MigrationRepository

    const applyMigrationService = new ApplyMigrationService({
      migrationFileSystem, migrationRepository, logger
    })

    // act
    await expect(applyMigrationService.execute()).rejects.toThrow('Migration file not found')

    // assert
    expect(migrationFileSystem.listMigrationFiles).toHaveBeenCalled()
    expect(migrationRepository.getAppliedMigrations).toHaveBeenCalled()
    expect(migrationRepository.applyMigration).not.toHaveBeenCalled()
  })

  test('should throw an error if there are missing files in the migration directory', async () => {
    // arrange
    const migrationFileSystem = {
      listMigrationFiles: vi.fn().mockReturnValue([
        'test/database/migrations/20250812025617_test1.ts',
        'test/database/migrations/20250812025618_test2.ts'
      ])
    } as unknown as MigrationFileSystem
    const migrationRepository = {
      ensureMigrationTableExists: vi.fn(),
      getAppliedMigrations: vi.fn().mockResolvedValue([{ name: '20250812025617_fake1', applied_at: new Date() }]),
      applyMigration: vi.fn()
    } as unknown as MigrationRepository

    const applyMigrationService = new ApplyMigrationService({
      migrationFileSystem, migrationRepository, logger
    })

    // act & expect
    await expect(applyMigrationService.execute()).rejects.toThrow('The migration directory is missing some files')
  })

  test('should log a warning if there are no pending migrations to apply', async () => {
    // arrange
    const migrationFileSystem = {
      listMigrationFiles: vi.fn().mockReturnValue([]),
      runMigrationFile: vi.fn()
    } as unknown as MigrationFileSystem
    const migrationRepository = {
      ensureMigrationTableExists: vi.fn(),
      getAppliedMigrations: vi.fn().mockResolvedValue([]),
      applyMigration: vi.fn()
    } as unknown as MigrationRepository

    const applyMigrationService = new ApplyMigrationService({
      migrationFileSystem, migrationRepository, logger
    })

    // act
    await applyMigrationService.execute()

    // assert
    expect(logger.warn).toHaveBeenCalledWith('No pending migrations to apply')
  })
})
