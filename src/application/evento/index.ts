import { type Knex } from 'knex'

import { AtualizarEventoUseCase } from '@/domain/evento/AtualizarEventoUseCase'
import { CriarEventoUseCase } from '@/domain/evento/CriarEventoUseCase'
import { RemoverEventoUseCase } from '@/domain/evento/RemoverEventoUseCase'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AtualizarEventoController } from './AtualizarEventoController'
import { CriarEventoController } from './CriarEventoController'
import { RemoverEventoController } from './RemoverEventoController'

export function routes(knex: Knex): Route[] {
  const eventoCollection = new EventoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new CriarEventoController({
          criarEventoUseCase: new CriarEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/expedicoes/:expedicaoId/eventos'
    },
    {
      handlers: [
        new AtualizarEventoController({
          atualizarEventoUseCase: new AtualizarEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/eventos/:eventoId'
    },
    {
      handlers: [
        new RemoverEventoController({
          removerEventoUseCase: new RemoverEventoUseCase({ eventoCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/eventos/:eventoId'
    }
  ]
}
