import { type Knex } from 'knex'

import { BuscarVegetacaoPorIdUseCase } from '@/domain/vegetacao/BuscarVegetacaoPorIdUseCase'
import { ListaVegetacoesUseCase } from '@/domain/vegetacao/ListaVegetacoesUseCase'
import { VegetacaoCollectionKnexAdapter } from '@/infrastructure/VegetacaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscarVegetacaoController } from './BuscarVegetacaoController'
import { ListaVegetacoesController } from './ListaVegetacoesController'

export function routes(knex: Knex): Route[] {
  const vegetacaoCollection = new VegetacaoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new ListaVegetacoesController({
          listaVegetacoesUseCase: new ListaVegetacoesUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/vegetacoes'
    },
    {
      handlers: [
        new BuscarVegetacaoController({
          buscarVegetacaoPorIdUseCase: new BuscarVegetacaoPorIdUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/vegetacoes/:vegetacaoId'
    }
  ]
}
