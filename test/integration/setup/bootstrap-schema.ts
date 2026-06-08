import type { Knex } from 'knex'

/**
 * Ensures minimal tables exist for integration tests on a fresh Docker test DB.
 * Knex migrations assume a legacy Sequelize schema; they are not run in docker mode.
 */
export async function bootstrapTestSchema(knex: Knex): Promise<void> {
  const hasPaises = await knex.schema.hasTable('paises')
  if (!hasPaises) {
    await knex.schema.createTable('paises', table => {
      table.increments('id').primary()
      table.string('nome', 255).notNullable()
      table.string('sigla', 10).nullable()
    })
  }

  const hasEstados = await knex.schema.hasTable('estados')
  if (!hasEstados) {
    await knex.schema.createTable('estados', table => {
      table.increments('id').primary()
      table.string('nome', 255).notNullable()
      table.string('sigla', 4).nullable()
      table.string('paises_sigla', 10).nullable()
    })
  }

  const hasMigrations = await knex.schema.hasTable('migrations')
  if (!hasMigrations) {
    await knex.schema.createTable('migrations', table => {
      table.string('name', 300).primary()
      table.dateTime('applied_at').notNullable().defaultTo(knex.fn.now())
    })
  }
}
