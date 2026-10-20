import { Knex } from 'knex'

/**
 * Lembrete de coleta: a mesma ficha botânica de `eventos_coletas`, mas sem
 * evento por trás. Guarda uma data e um local para voltar a coletar numa
 * expedição futura.
 *
 * Como na ficha de coleta, os campos são strings planas, não FKs: a captura
 * é offline e a determinação é provisória.
 */
const CAMPOS_DA_FICHA = [
  'familia',
  'nome_popular',
  'nome_cientifico',
  'municipio',
  'estado',
  'referencia_local',
  'tipo_vegetacao',
  'solo',
  'relevo',
  'substrato',
  'tronco_com_casca',
  'associacoes',
  'folhas',
  'habito',
  'frutos',
  'flores',
  'luminosidade'
]

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('lembretes')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('lembretes', table => {
      table.increments('id').primary()

      table.date('data_coleta').notNullable()
      table.text('local_coleta').notNullable()

      CAMPOS_DA_FICHA.forEach(campo => {
        table.text(campo).nullable()
      })

      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now())
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now())

      table.bigInteger('created_by').nullable()
      table.foreign('created_by')
        .references('id')
        .inTable('usuarios')
        .onDelete('NO ACTION')
        .onUpdate('CASCADE')

      table.bigInteger('updated_by').nullable()
      table.foreign('updated_by')
        .references('id')
        .inTable('usuarios')
        .onDelete('NO ACTION')
        .onUpdate('CASCADE')

      table.index('data_coleta', 'lembretes_data_coleta_index')
    })
  })
}
