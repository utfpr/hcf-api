import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AtualizaLembreteUseCase } from '@/domain/lembrete/AtualizaLembreteUseCase'
import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { LembreteCollectionKnexAdapter } from '@/infrastructure/LembreteCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AtualizaLembreteController } from './AtualizaLembreteController'
import { BuscaLembreteController } from './BuscaLembreteController'
import { CriaLembreteController } from './CriaLembreteController'
import { ListaLembretesController } from './ListaLembretesController'
import { RemoveLembreteController } from './RemoveLembreteController'

export function routes(knex: Knex): Route[] {
  const lembreteCollection = new LembreteCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Lembrete'),
        new ListaLembretesController({ lembreteCollection })
      ],
      method: Method.Get,
      path: '/v1/lembretes'
    },
    {
      handlers: [
        authorize('create', 'Lembrete'),
        new CriaLembreteController({
          criaLembreteUseCase: new CriaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Post,
      path: '/v1/lembretes'
    },
    {
      handlers: [
        authorize('read', 'Lembrete'),
        new BuscaLembreteController({ lembreteCollection })
      ],
      method: Method.Get,
      path: '/v1/lembretes/:lembreteId'
    },
    {
      handlers: [
        authorize('update', 'Lembrete'),
        new AtualizaLembreteController({
          atualizaLembreteUseCase: new AtualizaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Put,
      path: '/v1/lembretes/:lembreteId'
    },
    {
      handlers: [
        authorize('delete', 'Lembrete'),
        new RemoveLembreteController({ lembreteCollection })
      ],
      method: Method.Delete,
      path: '/v1/lembretes/:lembreteId'
    }
  ]
}
