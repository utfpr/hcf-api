import { CreateMigrationService } from '~/database/create-migration-service'
import { MigrationFileSystem } from '~/database/migration-file-system'

describe('Database > Create Migration Service', () => {
  test('should create a migration file', async () => {
    // arrange
    const migrationFileSystem = {
      createMigrationFile: jest.fn().mockResolvedValue('test/database/migrations/20250812025617_test.ts')
    } as unknown as MigrationFileSystem
    const createMigrationService = new CreateMigrationService({ migrationFileSystem })

    // act
    const migrationFile = await createMigrationService.execute('test')

    // assert
    expect(migrationFile).toEqual(expect.stringMatching(/test\/database\/migrations\/[0-9]+_test\.ts/))
  })
})
