/* eslint-disable */

import { parseFile } from 'fast-csv'
import { Knex } from 'knex'

const getSinitizedState: { [key: string]: string } = {
  PARANA: 'Paraná',
  'SANTA CATARINA': 'Santa Catarina',
  'RIO GRANDE DO SUL': 'Rio Grande do Sul',
  'SAO PAULO': 'São Paulo',
  'RIO DE JANEIRO': 'Rio de Janeiro',
  'MINAS GERAIS': 'Minas Gerais',
  'ESPIRITO SANTO': 'Espírito Santo',
  'DISTRITO FEDERAL': 'Distrito Federal',
  GOIAS: 'Goiás',
  'MATO GROSSO DO SUL': 'Mato Grosso do Sul',
  'MATO GROSSO': 'Mato Grosso',
  TOCANTINS: 'Tocantins',
  BAHIA: 'Bahia',
  SERGIPE: 'Sergipe',
  ALAGOAS: 'Alagoas',
  PERNAMBUCO: 'Pernambuco',
  CEARA: 'Ceará',
  'RIO GRANDE DO NORTE': 'Rio Grande do Norte',
  PARAIBA: 'Paraíba',
  MARANHAO: 'Maranhão',
  PIAUI: 'Piauí',
  AMAPA: 'Amapá',
  RORAIMA: 'Roraima',
  AMAZONAS: 'Amazonas',
  ACRE: 'Acre',
  RONDONIA: 'Rondônia',
  PARA: 'Pará',
  CEARÁ: 'Ceará'
}

export async function run(knex: Knex): Promise<void> {
  const updates: Array<{
    CODIGO: string;
    CIDADE: string;
    ESTADO: string;
    PAIS: string;
  }> = []

  await new Promise<void>((resolve, reject) => {
    parseFile(`${__dirname}/locais_traduzidos.csv`, { headers: true })
      .on('error', error => reject(error))
      .on('data', row => {
        updates.push(row)
      })
      .on('end', () => resolve())
  })

  await knex.transaction(async trx => {
    for (const update of updates) {
      const { CODIGO, CIDADE, ESTADO, PAIS } = update

      let cidadeId: number | null = null

      if (CIDADE !== 'NI') {
        // Já temos o ID final no CSV
        cidadeId = Number(CIDADE)
      } else {
        if (ESTADO === 'NI') {
          // Caso especial onde tanto cidade quanto estado são "Não Informado"
          const paisRecord = await trx('paises').where({ nome: PAIS })
            .first()

          if (!paisRecord) {
            continue
          }

          const estadoRecord = await trx('estados')
            .where({ sigla: 'NI', pais_id: paisRecord.id })
            .first()

          if (!estadoRecord) {
            continue
          }

          const cidadeRecord = await trx('cidades')
            .where({ nome: 'Não Informado', estado_id: estadoRecord.id })
            .first()

          if (!cidadeRecord) {
            continue
          }

          await trx('locais_coleta')
            .where({ id: CODIGO })
            .update({ cidade_id: cidadeRecord.id })

          continue
        }

        const estadoRecord = await trx('estados')
          .where({ nome: getSinitizedState[ESTADO] })
          .first()

        if (!estadoRecord) {
          continue
        }

        const cidadeRecord = await trx('cidades')
          .where({ nome: 'Não Informado', estado_id: estadoRecord.id })
          .first()

        if (!cidadeRecord) {
          continue
        }

        cidadeId = cidadeRecord.id
      }

      if (cidadeId) {
        await trx('locais_coleta')
          .where({ id: CODIGO })
          .update({ cidade_id: cidadeId })
      }
    }
  })

  console.log('Atualização concluída!')
}
