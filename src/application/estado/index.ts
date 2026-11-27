import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import { EstadoCollectionKnexAdapter } from '@/infrastructure/EstadoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { ListaEstadosController } from './ListaEstadosController'

/**
 * Registra a rota da API REST para consulta de estados de um país.
 * Configura controller e autorização CASL para leitura do recurso Estado.
 *
 * @param knex Instância de conexão Knex com o banco de dados.
 * @returns Array de rotas configuradas para o recurso Estado.
 */
export function routes(knex: Knex): Route[] {
  const estadoCollection = new EstadoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Estado'),
        new ListaEstadosController({
          listaEstadosUseCase: new ListaEstadosUseCase({ estadoCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/paises/:paisSigla/estados'
    }
  ]
}
