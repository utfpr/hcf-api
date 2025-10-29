import { Knex } from 'knex'
import fs from 'node:fs'

import { MigrationFileSystem } from '@/database/migration-file-system'

jest.mock('node:fs', () => ({
  writeFileSync: jest.fn(),
  readdirSync: jest.fn()
}))

interface MockedFs {
  readdirSync: (...args: any[]) => string[]
}

describe('Database > Migration FileSystem', () => {
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

    jest.mocked<MockedFs>(fs).readdirSync.mockReturnValue(['20250812025617_migration1.ts', '20250812025618_migration2.ts'])

    const migrationFileSystem = new MigrationFileSystem({ knex, migrationsPath: 'test/database/migrations' })
    const migrationFiles = migrationFileSystem.listMigrationFiles()

    // assert
    expect(migrationFiles).toEqual(['test/database/migrations/20250812025617_migration1.ts', 'test/database/migrations/20250812025618_migration2.ts'])
  })
})
