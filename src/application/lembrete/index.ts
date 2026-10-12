import { type Knex } from 'knex'

import { AtualizaLembreteUseCase } from '@/domain/lembrete/AtualizaLembreteUseCase'
import { BuscaLembreteUseCase } from '@/domain/lembrete/BuscaLembreteUseCase'
import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { ListaLembretesUseCase } from '@/domain/lembrete/ListaLembretesUseCase'
import { RemoveLembreteUseCase } from '@/domain/lembrete/RemoveLembreteUseCase'
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

  // TODO: adicionar autenticação quando a camada HTTP de autenticação estiver disponível.

  return [
    {
      handlers: [
        new ListaLembretesController({
          listaLembretesUseCase: new ListaLembretesUseCase({ lembreteCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/lembretes'
    },
    {
      handlers: [
        new CriaLembreteController({
          criaLembreteUseCase: new CriaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/lembretes'
    },
    {
      handlers: [
        new BuscaLembreteController({
          buscaLembreteUseCase: new BuscaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/lembretes/:lembreteId'
    },
    {
      handlers: [
        new AtualizaLembreteController({
          atualizaLembreteUseCase: new AtualizaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/lembretes/:lembreteId'
    },
    {
      handlers: [
        new RemoveLembreteController({
          removeLembreteUseCase: new RemoveLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/lembretes/:lembreteId'
    }
  ]
}
