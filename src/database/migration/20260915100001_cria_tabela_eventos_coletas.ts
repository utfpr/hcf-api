import { Knex } from 'knex'

/**
 * Ficha botânica de campo. Existe apenas para eventos com tipo = 'COLETA'; a
 * garantia de que toda coleta tem a sua é da transação do adapter, já que uma
 * constraint entre tabelas não é expressável aqui.
 *
 * Os campos são strings planas, não FKs para familias/cidades/vegetacoes/solos/
 * relevos: a captura é offline e a determinação é provisória. A normalização
 * acontece na promoção a tombo.
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
  const hasTable = await knex.schema.hasTable('eventos_coletas')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('eventos_coletas', table => {
      table.integer('evento_id').primary()
      table.foreign('evento_id')
        .references('id')
        .inTable('eventos')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      CAMPOS_DA_FICHA.forEach(campo => {
        table.text(campo).nullable()
      })
    })
  })
}
