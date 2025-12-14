import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const clean = (col: string) =>
    knex.raw(`TRIM(REGEXP_REPLACE(${col}, '\\\\s+', ' '))`)

  const updates: { table: string; columns: string[] }[] = [
    { table: 'autores', columns: ['nome'] },
    { table: 'coletores', columns: ['nome', 'email'] },
    { table: 'identificadores', columns: ['nome'] },
    { table: 'familias', columns: ['nome'] },
    { table: 'generos', columns: ['nome'] },
    { table: 'sub_familias', columns: ['nome'] },
    { table: 'especies', columns: ['nome'] },
    { table: 'sub_especies', columns: ['nome'] },
    { table: 'variedades', columns: ['nome'] },
    { table: 'reinos', columns: ['nome'] },
    { table: 'herbarios', columns: ['nome', 'sigla'] },
    { table: 'locais_coleta', columns: ['descricao', 'complemento'] },
    { table: 'cidades', columns: ['nome'] },
    { table: 'estados', columns: ['nome', 'sigla'] },
    { table: 'paises', columns: ['nome', 'sigla'] },
    { table: 'tipos', columns: ['nome'] }
  ]

  for (const item of updates) {
    for (const col of item.columns) {
      await knex(item.table)
        .update(col, clean(col))
        .whereNotNull(col)
    }
  }
}
