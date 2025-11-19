import { Knex } from 'knex'

type FaseRow = { nome: string }

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const hasColumn = await trx.schema.hasColumn('tombos', 'fase_sucessional_id')
    if (!hasColumn) {
      await trx.schema.alterTable('tombos', table => {
        table
          .integer('fase_sucessional_id')
          .unsigned()
          .nullable()
          .references('numero')
          .inTable('fase_sucessional')
          .onUpdate('CASCADE')
          .onDelete('SET NULL')
      })
    }

    const fases = [
      'Estágio Inicial',
      'Estágio Médio',
      'Estágio Avançado'
    ]

    const existentes = await trx<FaseRow>('fase_sucessional')
      .select('nome')
      .whereIn('nome', fases)

    const existentesSet = new Set<string>((existentes ?? []).map(r => r.nome))
    const paraInserir = fases
      .filter(nome => !existentesSet.has(nome))
      .map(nome => ({ nome }))

    if (paraInserir.length > 0) {
      await trx('fase_sucessional').insert(paraInserir)
    }
  })
}
