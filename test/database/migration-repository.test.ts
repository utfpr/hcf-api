import { Knex } from 'knex'
import {
  vi, describe, expect, test
} from 'vitest'

import { Logger } from '@/library/logger'

import { MigrationRepository } from '../../src/database/migration-repository'

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

describe('Database > Migration Repository', () => {
  test('should create migration table if it does not exist', async () => {
    // arrange
    const tableMock = {
      string: vi.fn().mockReturnThis(),
      primary: vi.fn().mockReturnThis(),
      dateTime: vi.fn().mockReturnThis(),
      notNullable: vi.fn().mockReturnThis(),
      defaultTo: vi.fn().mockReturnThis()
    }

    const createTableMock = vi.fn().mockImplementation((_, callback: (table: typeof tableMock) => void) => {
      callback(tableMock)
      return Promise.resolve()
    })

    const knex = {
      schema: {
        createTable: createTableMock,
        hasTable: vi.fn().mockResolvedValue(false)
      },
      fn: {
        now: vi.fn().mockReturnValue('NOW()')
      }
    } as unknown as Knex

    // act
    const migrationRepository = new MigrationRepository({
      knex, tableName: 'migrations', logger
    })
    await migrationRepository.ensureMigrationTableExists()

    // assert
    expect(knex.schema.createTable).toHaveBeenCalledWith('migrations', expect.any(Function))
    expect(knex.schema.hasTable).toHaveBeenCalledWith('migrations')
    expect(tableMock.string).toHaveBeenCalledWith('name', 300)
    expect(tableMock.primary).toHaveBeenCalled()
    expect(tableMock.dateTime).toHaveBeenCalledWith('applied_at')
    expect(tableMock.notNullable).toHaveBeenCalled()
    expect(tableMock.defaultTo).toHaveBeenCalledWith('NOW()')
  })

  test('should not create migration table if it already exists', async () => {
    // arrange
    const knex = {
      schema: {
        createTable: vi.fn(),
        hasTable: vi.fn().mockResolvedValue(true)
      }
    } as unknown as Knex

    // act
    const migrationRepository = new MigrationRepository({
      knex, tableName: 'migrations', logger
    })
    await migrationRepository.ensureMigrationTableExists()

    // assert
    expect(knex.schema.createTable).not.toHaveBeenCalled()
  })

  test('should insert the migration name and applied_at date into the migration table', async () => {
    // arrange
    const insert = vi.fn()
    const knex = vi.fn().mockReturnValue({ insert }) as unknown as Knex

    const migrationRepository = new MigrationRepository({
      knex, tableName: 'migrations', logger
    })
    await migrationRepository.applyMigration('test')

    // assert
    expect(knex).toHaveBeenCalledWith('migrations')
    expect(insert).toHaveBeenCalledWith({ name: 'test', applied_at: expect.any(Date) })
  })

  test('should return the list of applied migrations', async () => {
    // arrange
    const select = vi.fn().mockResolvedValue([{ name: 'test', applied_at: new Date() }])
    const knex = vi.fn().mockReturnValue({ select }) as unknown as Knex

    const migrationRepository = new MigrationRepository({
      knex, tableName: 'migrations', logger
    })
    const appliedMigrations = await migrationRepository.getAppliedMigrations()

    // assert
    expect(knex).toHaveBeenCalledWith('migrations')
    expect(select).toHaveBeenCalledWith(['name', 'applied_at'])
    expect(appliedMigrations).toEqual([{ name: 'test', applied_at: expect.any(Date) }])
  })
})
