import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const updates = [
    { old: 'Amparo de São Francisco', new: 'Amparo do São Francisco' },
    { old: 'Augusto Severo (Campo Grande)', new: 'Campo Grande' },
    { old: 'Barão de Monte Alto', new: 'Barão do Monte Alto' },
    { old: 'Biritiba-Mirim', new: 'Biritiba Mirim' },
    { old: 'Dona Eusébia', new: 'Dona Euzébia' },
    { old: 'Florínia', new: 'Florínea' },
    { old: 'Fortaleza do Tabocão', new: 'Tabocão' },
    { old: 'Gracho Cardoso', new: 'Graccho Cardoso' },
    { old: 'Grão Pará', new: 'Grão-Pará' },
    { old: 'Januário Cicco (Boa Saúde)', new: 'Januário Cicco' },
    { old: 'Muquém de São Francisco', new: 'Muquém do São Francisco' },
    { old: 'Olho-d\'Água do Borges', new: 'Olho d\'Água do Borges' },
    { old: 'Olhos d\'Água', new: 'Olhos-d\'Água' },
    { old: 'Passa-Vinte', new: 'Passa Vinte' },
    { old: 'Santo Antônio do Leverger', new: 'Santo Antônio de Leverger' },
    { old: 'São Caetano', new: 'São Caitano' },
    { old: 'São Thomé das Letras', new: 'São Tomé das Letras' }
  ]

  const queries = updates.map(({ old, new: novo }) =>
    knex('cidades')
      .where('nome', old)
      .update({ nome: novo })
  )

  await Promise.all(queries)
}
