import { Knex } from 'knex'
import fs from 'node:fs'
import {
  vi, describe, expect, test, beforeEach
} from 'vitest'

import { MigrationFileSystem } from '@/database/migration-file-system'

vi.mock('node:fs', () => ({
  default: {
    writeFileSync: vi.fn(),
    readdirSync: vi.fn(),
    existsSync: vi.fn()
  }
}))

interface MockedFs {
  readdirSync: (...args: any[]) => string[]
  existsSync: (...args: any[]) => boolean
}

describe('Database > Migration FileSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should create a migration file', () => {
    // arrange
    const knex = {} as unknown as Knex

    const migrationFileSystem = new MigrationFileSystem({ knex, migrationsPath: 'test/database/migrations' })
    const migrationFile = migrationFileSystem.createMigrationFile('test')

    // assert
    expect(migrationFile).toEqual(expect.stringMatching(/test\/database\/migrations\/[0-9]+_test\.ts/))
  })

  test('should list migration files', () => {
    // arrange
    const knex = {} as unknown as Knex

    vi.mocked<MockedFs>(fs).readdirSync.mockReturnValue(['20250812025617_migration1.ts', '20250812025618_migration2.ts'])

    const migrationFileSystem = new MigrationFileSystem({ knex, migrationsPath: 'test/database/migrations' })
    const migrationFiles = migrationFileSystem.listMigrationFiles()

    // assert
    expect(migrationFiles).toEqual(['test/database/migrations/20250812025617_migration1.ts', 'test/database/migrations/20250812025618_migration2.ts'])
  })

  test('should run migration file with .ts extension', async () => {
    // arrange
    const knex = { raw: vi.fn().mockResolvedValue(undefined) } as unknown as Knex
    const migrationFileSystem = new MigrationFileSystem({ knex, migrationsPath: 'test/database/migrations' })

    vi.mocked<MockedFs>(fs).existsSync.mockImplementation((filePath: string) => {
      return filePath.toString().endsWith('.ts')
    })

    vi.doMock('test/database/migrations/20250812025617_migration1.ts', () => ({
      run: vi.fn().mockResolvedValue(undefined)
    }))

    // act
    await migrationFileSystem.runMigrationFile('20250812025617_migration1')

    // assert
    expect(fs.existsSync).toHaveBeenCalled()
  })

  test('should run migration file with .js extension', async () => {
    // arrange
    const knex = { raw: vi.fn().mockResolvedValue(undefined) } as unknown as Knex
    const migrationFileSystem = new MigrationFileSystem({ knex, migrationsPath: 'test/database/migrations' })

    vi.mocked<MockedFs>(fs).existsSync.mockImplementation((filePath: string) => {
      return filePath.toString().endsWith('.js')
    })

    vi.doMock('test/database/migrations/20250812025617_migration1.js', () => ({
      run: vi.fn().mockResolvedValue(undefined)
    }))

    // act
    await migrationFileSystem.runMigrationFile('20250812025617_migration1')

    // assert
    expect(fs.existsSync).toHaveBeenCalled()
  })

  test('should throw error when migration file does not exist', async () => {
    // arrange
    const knex = {} as unknown as Knex
    const migrationFileSystem = new MigrationFileSystem({ knex, migrationsPath: 'test/database/migrations' })

    vi.mocked<MockedFs>(fs).existsSync.mockReturnValue(false)

    // act & assert
    await expect(
      migrationFileSystem.runMigrationFile('20250812025617_migration1')
    ).rejects.toThrow('Migration file 20250812025617_migration1 not found')
  })
})
