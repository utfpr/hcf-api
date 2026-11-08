import { Knex } from 'knex'

/**
 * Campos da ficha de coleta impressa que faltavam: altura e exsudado (bloco
 * Hábito) e as cores do cálice e da corola (bloco Flores). A coluna `flores`
 * continua guardando a observação das flores.
 */
const CAMPOS_NOVOS = [
  'altura',
  'exsudado',
  'flores_cor_calice',
  'flores_cor_corola'
]

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    for (const campo of CAMPOS_NOVOS) {
      const hasColumn = await trx.schema.hasColumn('eventos_coletas', campo)
      if (!hasColumn) {
        await trx.schema.alterTable('eventos_coletas', table => {
          table.text(campo).nullable()
        })
      }
    }
  })
}
