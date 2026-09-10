import { type Knex } from 'knex'

import { BuscaVegetacaoPorIdUseCase } from '@/domain/vegetacao/BuscaVegetacaoPorIdUseCase'
import { CadastraVegetacaoUseCase } from '@/domain/vegetacao/CadastraVegetacaoUseCase'
import { ListaVegetacoesUseCase } from '@/domain/vegetacao/ListaVegetacoesUseCase'
import { RemoveVegetacaoUseCase } from '@/domain/vegetacao/RemoveVegetacaoUseCase'
import { RenomeiaVegetacaoUseCase } from '@/domain/vegetacao/RenomeiaVegetacaoUseCase'
import { VegetacaoCollectionKnexAdapter } from '@/infrastructure/VegetacaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaVegetacaoController } from './BuscaVegetacaoController'
import { CadastraVegetacaoController } from './CadastraVegetacaoController'
import { ListaVegetacoesController } from './ListaVegetacoesController'
import { RemoveVegetacaoController } from './RemoveVegetacaoController'
import { RenomeiaVegetacaoController } from './RenomeiaVegetacaoController'
import { RequireVegetacaoWriteAccess } from './RequireVegetacaoWriteAccess'

export function routes(knex: Knex): Route[] {
  const vegetacaoCollection = new VegetacaoCollectionKnexAdapter({ knex })
  const requireVegetacaoWriteAccess = new RequireVegetacaoWriteAccess()

  return [
    {
      handlers: [
        requireVegetacaoWriteAccess,
        new CadastraVegetacaoController({
          cadastraVegetacaoUseCase: new CadastraVegetacaoUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/vegetacoes'
    },
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
        new BuscaVegetacaoController({
          buscaVegetacaoPorIdUseCase: new BuscaVegetacaoPorIdUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/vegetacoes/:vegetacaoId'
    },
    {
      handlers: [
        requireVegetacaoWriteAccess,
        new RenomeiaVegetacaoController({
          renomeiaVegetacaoUseCase: new RenomeiaVegetacaoUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/vegetacoes/:vegetacaoId'
    },
    {
      handlers: [
        requireVegetacaoWriteAccess,
        new RemoveVegetacaoController({
          removeVegetacaoUseCase: new RemoveVegetacaoUseCase({ vegetacaoCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/vegetacoes/:vegetacaoId'
    }
  ]
}
