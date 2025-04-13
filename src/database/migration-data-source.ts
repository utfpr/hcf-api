import { Knex } from 'knex'

interface Dependencies {
  knex: Knex
  tableName: string
}

export class MigrationDataSource {

  private readonly knex: Knex
  private readonly tableName: string

  constructor(readonly dependencies: Dependencies) {
    this.knex = dependencies.knex
    this.tableName = dependencies.tableName
  }

  async ensureMigrationTableExists(): Promise<void> {
    const exists = await this.knex.schema.hasTable(this.tableName)
    if (exists) return

    await this.knex.schema.createTableIfNotExists(this.tableName, table => {
      table.string('name', 300).primary()
      table.dateTime('applied_at').notNullable()
    })
  }

  async getAppliedMigrations(): Promise<Array<{ name: string; applied_at: Date }>> {
    return this.knex(this.tableName).select(['name', 'applied_at'])
  }

  async applyMigration(name: string, content: string): Promise<void> {
    await this.knex.transaction(async trx => {
      await trx.raw(content)
      await trx(this.tableName).insert({ name, applied_at: new Date() })
    })
  }

}
