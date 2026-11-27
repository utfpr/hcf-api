import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { CadastraLocalColetaUseCase } from '@/domain/localColeta/CadastraLocalColetaUseCase'
import { RemoveLocalColetaUseCase } from '@/domain/localColeta/RemoveLocalColetaUseCase'
import { RenomeiaLocalColetaUseCase } from '@/domain/localColeta/RenomeiaLocalColetaUseCase'
import { LocalColetaCollectionKnexAdapter } from '@/infrastructure/LocalColetaCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaLocalColetaController } from './BuscaLocalColetaController'
import { CadastraLocalColetaController } from './CadastraLocalColetaController'
import { ListaLocaisDeColetaController } from './ListaLocaisDeColetaController'
import { RemoveLocalColetaController } from './RemoveLocalColetaController'
import { RenomeiaLocalColetaController } from './RenomeiaLocalColetaController'

/**
 * Registra as rotas da API REST para gerenciamento de locais de coleta.
 * Configura controllers e autorizações CASL para ações de leitura, criação, atualização e exclusão.
 *
 * @param knex Instância de conexão Knex com o banco de dados.
 * @returns Array de rotas configuradas para o recurso LocalColeta.
 */
export function routes(knex: Knex): Route[] {
  const localColetaCollection = new LocalColetaCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('create', 'LocalColeta'),
        new CadastraLocalColetaController({
          cadastraLocalColetaUseCase: new CadastraLocalColetaUseCase({ localColetaCollection })
        })
      ],
      method: Method.Post,
      path: '/v1/locais-coleta'
    },
    {
      handlers: [
        authorize('read', 'LocalColeta'),
        new ListaLocaisDeColetaController({
          localColetaCollection
        })
      ],
      method: Method.Get,
      path: '/v1/locais-coleta'
    },
    {
      handlers: [
        authorize('read', 'LocalColeta'),
        new BuscaLocalColetaController({
          localColetaCollection
        })
      ],
      method: Method.Get,
      path: '/v1/locais-coleta/:localColetaId'
    },
    {
      handlers: [
        authorize('update', 'LocalColeta'),
        new RenomeiaLocalColetaController({
          renomeiaLocalColetaUseCase: new RenomeiaLocalColetaUseCase({ localColetaCollection })
        })
      ],
      method: Method.Put,
      path: '/v1/locais-coleta/:localColetaId'
    },
    {
      handlers: [
        authorize('delete', 'LocalColeta'),
        new RemoveLocalColetaController({
          removeLocalColetaUseCase: new RemoveLocalColetaUseCase({ localColetaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v1/locais-coleta/:localColetaId'
    }
  ]
}
