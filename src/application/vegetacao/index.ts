import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { CadastraVegetacaoUseCase } from '@/domain/vegetacao/CadastraVegetacaoUseCase'
import { ListaVegetacoesUseCase } from '@/domain/vegetacao/ListaVegetacoesUseCase'
import { RenomeiaVegetacaoUseCase } from '@/domain/vegetacao/RenomeiaVegetacaoUseCase'
import { VegetacaoCollectionKnexAdapter } from '@/infrastructure/VegetacaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaVegetacaoController } from './BuscaVegetacaoController'
import { CadastraVegetacaoController } from './CadastraVegetacaoController'
import { ListaVegetacoesController } from './ListaVegetacoesController'
import { RemoveVegetacaoController } from './RemoveVegetacaoController'
import { RenomeiaVegetacaoController } from './RenomeiaVegetacaoController'

export function routes(knex: Knex): Route[] {
  const vegetacaoCollection = new VegetacaoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('create', 'Vegetacao'),
        new CadastraVegetacaoController({
          cadastraVegetacaoUseCase: new CadastraVegetacaoUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Post,
      path: '/v1/vegetacoes'
    },
    {
      handlers: [
        authorize('read', 'Vegetacao'),
        new ListaVegetacoesController({
          listaVegetacoesUseCase: new ListaVegetacoesUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/vegetacoes'
    },
    {
      handlers: [
        authorize('read', 'Vegetacao'),
        new BuscaVegetacaoController({ vegetacaoCollection })
      ],
      method: Method.Get,
      path: '/v1/vegetacoes/:vegetacaoId'
    },
    {
      handlers: [
        authorize('update', 'Vegetacao'),
        new RenomeiaVegetacaoController({
          renomeiaVegetacaoUseCase: new RenomeiaVegetacaoUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Put,
      path: '/v1/vegetacoes/:vegetacaoId'
    },
    {
      handlers: [
        authorize('delete', 'Vegetacao'),
        new RemoveVegetacaoController({ vegetacaoCollection })
      ],
      method: Method.Delete,
      path: '/v1/vegetacoes/:vegetacaoId'
    }
  ]
}
