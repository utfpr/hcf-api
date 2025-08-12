import { Knex } from 'knex'

interface Dependencies {
  knex: Knex
  tableName: string
}

export class MigrationRepository {

  private readonly knex: Knex
  private readonly tableName: string

  constructor(readonly dependencies: Dependencies) {
    this.knex = dependencies.knex
    this.tableName = dependencies.tableName
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
    console.info(`Applying migration ${name}`) // eslint-disable-line no-console
    await this.knex(this.tableName).insert({ name, applied_at: new Date() })
  }

}
