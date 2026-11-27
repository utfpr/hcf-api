import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { BuscaSoloPorIdUseCase } from '@/domain/solo/BuscaSoloPorIdUseCase'
import { CadastraSoloUseCase } from '@/domain/solo/CadastraSoloUseCase'
import { ListaSolosUseCase } from '@/domain/solo/ListaSolosUseCase'
import { RemoveSoloUseCase } from '@/domain/solo/RemoveSoloUseCase'
import { RenomeiaSoloUseCase } from '@/domain/solo/RenomeiaSoloUseCase'
import { SoloCollectionKnexAdapter } from '@/infrastructure/SoloCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaSoloController } from './BuscaSoloController'
import { CadastraSoloController } from './CadastraSoloController'
import { ListaSolosController } from './ListaSolosController'
import { RemoveSoloController } from './RemoveSoloController'
import { RenomeiaSoloController } from './RenomeiaSoloController'

/**
 * Registra as rotas da API REST para gerenciamento de solos.
 * Configura controllers e middlewares de autorização CASL por ação (create, update, delete).
 *
 * @param knex Instância de conexão Knex com o banco de dados.
 * @returns Array de rotas configuradas para o recurso Solo.
 */
export function routes(knex: Knex): Route[] {
  const soloCollection = new SoloCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new ListaSolosController({
          listaSolosUseCase: new ListaSolosUseCase({ soloCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/solos'
    },
    {
      handlers: [
        new BuscaSoloController({
          buscaSoloPorIdUseCase: new BuscaSoloPorIdUseCase({ soloCollection })
        })
      ],
      method: Method.Get,
      path: '/v1/solos/:soloId'
    },
    {
      handlers: [
        authorize('create', 'Solo'),
        new CadastraSoloController({
          cadastraSoloUseCase: new CadastraSoloUseCase({ soloCollection })
        })
      ],
      method: Method.Post,
      path: '/v1/solos'
    },
    {
      handlers: [
        authorize('update', 'Solo'),
        new RenomeiaSoloController({
          renomeiaSoloUseCase: new RenomeiaSoloUseCase({ soloCollection })
        })
      ],
      method: Method.Put,
      path: '/v1/solos/:soloId'
    },
    {
      handlers: [
        authorize('delete', 'Solo'),
        new RemoveSoloController({
          removeSoloUseCase: new RemoveSoloUseCase({ soloCollection })
        })
      ],
      method: Method.Delete,
      path: '/v1/solos/:soloId'
    }
  ]
}
