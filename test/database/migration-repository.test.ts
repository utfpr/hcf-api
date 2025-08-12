import { Knex } from 'knex'

import { MigrationRepository } from '../../src/database/migration-repository'

describe('Database > Migration Repository', () => {
  test('should create migration table if it does not exist', async () => {
    // arrange
    const knex = {
      schema: {
        createTable: jest.fn(),
        hasTable: jest.fn().mockResolvedValue(false)
      }
    } as unknown as Knex

    // act
    const migrationRepository = new MigrationRepository({ knex, tableName: 'migrations' })
    await migrationRepository.ensureMigrationTableExists()

    // assert
    expect(knex.schema.createTable).toHaveBeenCalledWith('migrations', expect.any(Function))
    expect(knex.schema.hasTable).toHaveBeenCalledWith('migrations')
  })

  test('should not create migration table if it already exists', async () => {
    // arrange
    const knex = {
      schema: {
        createTable: jest.fn(),
        hasTable: jest.fn().mockResolvedValue(true)
      }
    } as unknown as Knex

    // act
    const migrationRepository = new MigrationRepository({ knex, tableName: 'migrations' })
    await migrationRepository.ensureMigrationTableExists()

    // assert
    expect(knex.schema.createTable).not.toHaveBeenCalled()
  })

  test('should insert the migration name and applied_at date into the migration table', async () => {
    // arrange
    const insert = jest.fn()
    const knex = jest.fn().mockReturnValue({
      insert
    }) as unknown as Knex

    const migrationRepository = new MigrationRepository({ knex, tableName: 'migrations' })
    await migrationRepository.applyMigration('test')

    // assert
    expect(knex).toHaveBeenCalledWith('migrations')
    expect(insert).toHaveBeenCalledWith({ name: 'test', applied_at: expect.any(Date) })
  })

  test('should return the list of applied migrations', async () => {
    // arrange
    const select = jest.fn().mockResolvedValue([
      { name: 'test', applied_at: new Date() }
    ])
    const knex = jest.fn().mockReturnValue({
      select
    }) as unknown as Knex

    const migrationRepository = new MigrationRepository({ knex, tableName: 'migrations' })
    const appliedMigrations = await migrationRepository.getAppliedMigrations()

    // assert
    expect(knex).toHaveBeenCalledWith('migrations')
    expect(select).toHaveBeenCalledWith(['name', 'applied_at'])
    expect(appliedMigrations).toEqual([{ name: 'test', applied_at: new Date() }])
  })
})
