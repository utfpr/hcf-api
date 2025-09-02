/* eslint-disable */

import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    let res

    res = await trx('locais_coleta').insert({
      descricao:
        'Parque Estadual Serra da Baitaca-Caminho do Itupava. Trilha entre a entrada p/ o antes da entrada para o Morro Pão de Loth',
      cidade_id: 4120804
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 42136
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'Parque Estadual Serra da Baitaca-Caminho do Itupava. Trilha entre a entrada p/ o Morro Pão de Loth até as Ruínas do Ipiranga',
      cidade_id: 4120804
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 41996
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama-Cabeça de Veado.ARIE do Córrego do Cedro. R.A. do Núcleo Bandeirante; SMPW. Q.26, conj. 3. Próximo à A.E.E. (EMBRAPA)',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30781
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama-Cabeça de Veado.ARIE do Córrego do Cedro. R.A. do Núcleo Bandeirante; Lagoa do Córrego do Cedro. Em frente ao SMPW Q.16 conj. 1',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30869
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama-Cabeça de Veado.ARIE do Córrego do Cedro. R.A. do Núcleo Bandeirante; Park Way. Clube da EMBRAPA. Q. 26. Conjunto 3 (área pública)',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30619
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama-Cabeça de Veado. ARIE Córrego do Cedro-R.A. Núcleo Bandeirante. SMPW Q 26 entre o conjunto 10 e a EMBRAPA (A.E.E)',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 20082
      })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30868
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama-Cabeça de Veado. ARIE Córrego do Cedro-R.A. Núcleo Bandeirante. SMPW Lagoa do Córrego do Cedro. Q 16. Conj. 01. Lote 4',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30780
      })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30801
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama-Cabeça de Veado. ARIE Córrego do Cedro-R.A. Núcleo Bandeirante. SMPW Park Way. Clube da EMBRAPA. Q 26. Conjunto 3 (área pública)',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30620
      })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 30621
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama e Cabeça de Veado, R.A. do Lago Sul. Fazenda Água Limpa (FAL-UnB). Área da "MOA"',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 20083
      })

    res = await trx('locais_coleta').insert({
      descricao:
        'APA Gama e Cabeça de Veado, R.A. do Lago Sul. Fazenda Água Limpa (FAL-UnB). Área Borda de mata de galeria do Córrego do Macaco, afluente Gama',
      cidade_id: 5300108
    })

    await trx('tombos')
      .update({
        local_coleta_id: res[0]
      })
      .where({
        hcf: 38121
      })
  })
}
