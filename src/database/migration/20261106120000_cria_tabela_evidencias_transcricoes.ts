import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('evidencias_transcricoes')) return
  await knex.schema.createTable('evidencias_transcricoes', table => {
    table.integer('evidencia_id').primary().references('id').inTable('evidencias').onDelete('CASCADE')
    table.string('status', 20).notNullable()
    table.text('texto_original').nullable()
    table.text('texto_revisado').nullable()
    table.integer('versao').notNullable().defaultTo(0)
    table.uuid('tentativa').notNullable()
    table.timestamp('processamento_expira_em', { useTz: true }).nullable()
    table.string('codigo_erro', 80).nullable()
    table.bigInteger('gerado_por').nullable().references('id').inTable('usuarios')
    table.timestamp('gerado_em', { useTz: true }).nullable()
    table.bigInteger('revisado_por').nullable().references('id').inTable('usuarios')
    table.timestamp('revisado_em', { useTz: true }).nullable()
  })
}
