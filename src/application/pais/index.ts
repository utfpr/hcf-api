import { type Knex } from 'knex'

import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { createAccessToken } from '@/factory/AccessTokenFactory'
import { createAuthorize } from '@/factory/AuthorizeMiddlewareFactory'
import { PaisCollectionKnexAdapter } from '@/infrastructure/PaisCollectionKnexAdapter'
import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { ListaPaisesController } from './ListaPaisesController'

export function routes(knex: Knex): Route[] {
  const paisCollection = new PaisCollectionKnexAdapter({ knex })
  const authorize = createAuthorize({
    accessToken: createAccessToken(),
    usuarioCollection: new UsuarioCollectionKnexAdapter({ knex }),
    usuarioSessaoCollection: new UsuarioSessaoCollectionKnexAdapter({ knex })
  })

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
