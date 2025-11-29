import { Knex } from 'knex'

import { Logger } from '@/library/logger'

interface Dependencies {
  knex: Knex
  tableName: string
  logger: Logger
}

export class MigrationRepository {
  private readonly knex: Knex
  private readonly tableName: string
  private readonly logger: Logger

  constructor(readonly dependencies: Dependencies) {
    this.knex = dependencies.knex
    this.tableName = dependencies.tableName
    this.logger = dependencies.logger
  }

  async ensureMigrationTableExists(): Promise<void> {
    const exists = await this.knex.schema.hasTable(this.tableName)
    if (exists) return

    await this.knex.schema.createTable(this.tableName, table => {
      table.string('name', 300).primary()
      table.dateTime('applied_at').notNullable()
        .defaultTo(this.knex.fn.now())
    })
  }

  async getAppliedMigrations(): Promise<Array<{ name: string; applied_at: Date }>> {
    return this.knex(this.tableName).select(['name', 'applied_at'])
  }

  async applyMigration(name: string): Promise<void> {
    this.logger.info(`Applying migration ${name}`)
    await this.knex(this.tableName).insert({ name, applied_at: new Date() })
  }
}
