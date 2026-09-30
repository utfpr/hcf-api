import { type Knex } from 'knex'

import { BuscaRelevoPorIdUseCase } from '@/domain/relevo/BuscaRelevoPorIdUseCase'
import { CadastraRelevoUseCase } from '@/domain/relevo/CadastraRelevoUseCase'
import { ListaRelevosUseCase } from '@/domain/relevo/ListaRelevosUseCase'
import { RemoveRelevoUseCase } from '@/domain/relevo/RemoveRelevoUseCase'
import { RenomeiaRelevoUseCase } from '@/domain/relevo/RenomeiaRelevoUseCase'
import { RelevoCollectionKnexAdapter } from '@/infrastructure/RelevoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { BuscaRelevoController } from './BuscaRelevoController'
import { CadastraRelevoController } from './CadastraRelevoController'
import { ExigePermissaoEscritaRelevo } from './ExigePermissaoEscritaRelevo'
import { ListaRelevosController } from './ListaRelevosController'
import { RemoveRelevoController } from './RemoveRelevoController'
import { RenomeiaRelevoController } from './RenomeiaRelevoController'

export function routes(knex: Knex): Route[] {
  const relevoCollection = new RelevoCollectionKnexAdapter({ knex })
  const exigePermissaoEscritaRelevo = new ExigePermissaoEscritaRelevo()

  return [
    {
      handlers: [
        new ListaRelevosController({
          listaRelevosUseCase: new ListaRelevosUseCase({ relevoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/relevos'
    },
    {
      handlers: [
        exigePermissaoEscritaRelevo,
        new CadastraRelevoController({
          cadastraRelevoUseCase: new CadastraRelevoUseCase({ relevoCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/relevos'
    },
    {
      handlers: [
        new BuscaRelevoController({
          buscaRelevoPorIdUseCase: new BuscaRelevoPorIdUseCase({ relevoCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/relevos/:relevoId'
    },
    {
      handlers: [
        exigePermissaoEscritaRelevo,
        new RenomeiaRelevoController({
          renomeiaRelevoUseCase: new RenomeiaRelevoUseCase({ relevoCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/relevos/:relevoId'
    },
    {
      handlers: [
        exigePermissaoEscritaRelevo,
        new RemoveRelevoController({
          removeRelevoUseCase: new RemoveRelevoUseCase({ relevoCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/relevos/:relevoId'
    }
  ]
}
