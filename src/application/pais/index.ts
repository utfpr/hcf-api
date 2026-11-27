import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { PaisCollectionKnexAdapter } from '@/infrastructure/PaisCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { ListaPaisesController } from './ListaPaisesController'

/**
 * Registra a rota da API REST para consulta de países.
 * Configura controller e autorização CASL para leitura do recurso Pais.
 *
 * @param knex Instância de conexão Knex com o banco de dados.
 * @returns Array de rotas configuradas para o recurso Pais.
 */
export function routes(knex: Knex): Route[] {
  const paisCollection = new PaisCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Pais'),
        new ListaPaisesController({
          listaPaisesUseCase: new ListaPaisesUseCase({ paisCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/paises'
    }
  ]
}
