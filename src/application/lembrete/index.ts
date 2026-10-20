import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AtualizaLembreteUseCase } from '@/domain/lembrete/AtualizaLembreteUseCase'
import { BuscaLembreteUseCase } from '@/domain/lembrete/BuscaLembreteUseCase'
import { CriaLembreteEvidenciaUseCase } from '@/domain/lembrete/CriaLembreteEvidenciaUseCase'
import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { ListaLembretesUseCase } from '@/domain/lembrete/ListaLembretesUseCase'
import { RemoveLembreteEvidenciaUseCase } from '@/domain/lembrete/RemoveLembreteEvidenciaUseCase'
import { RemoveLembreteUseCase } from '@/domain/lembrete/RemoveLembreteUseCase'
import { lembreteEvidenciaUpload } from '@/infrastructure/EvidenciaUploadMiddleware'
import { LembreteCollectionKnexAdapter } from '@/infrastructure/LembreteCollectionKnexAdapter'
import { LembreteEvidenciaCollectionKnexAdapter } from '@/infrastructure/LembreteEvidenciaCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AtualizaLembreteController } from './AtualizaLembreteController'
import { BuscaLembreteController } from './BuscaLembreteController'
import { CriaLembreteController } from './CriaLembreteController'
import { CriaLembreteEvidenciaController } from './CriaLembreteEvidenciaController'
import { ListaLembreteEvidenciasController } from './ListaLembreteEvidenciasController'
import { ListaLembretesController } from './ListaLembretesController'
import { RemoveLembreteController } from './RemoveLembreteController'
import { RemoveLembreteEvidenciaController } from './RemoveLembreteEvidenciaController'

export function routes(knex: Knex): Route[] {
  const lembreteCollection = new LembreteCollectionKnexAdapter({ knex })
  const lembreteEvidenciaCollection = new LembreteEvidenciaCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Lembrete'),
        new ListaLembretesController({
          listaLembretesUseCase: new ListaLembretesUseCase({ lembreteCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/lembretes'
    },
    {
      handlers: [
        authorize('create', 'Lembrete'),
        new CriaLembreteController({
          criaLembreteUseCase: new CriaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Post,
      path: '/v2/lembretes'
    },
    {
      handlers: [
        authorize('read', 'Lembrete'),
        new BuscaLembreteController({
          buscaLembreteUseCase: new BuscaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Get,
      path: '/v2/lembretes/:lembreteId'
    },
    {
      handlers: [
        authorize('update', 'Lembrete'),
        new AtualizaLembreteController({
          atualizaLembreteUseCase: new AtualizaLembreteUseCase({ lembreteCollection })
        })
      ],
      method: Method.Put,
      path: '/v2/lembretes/:lembreteId'
    },
    {
      handlers: [
        authorize('delete', 'Lembrete'),
        new RemoveLembreteController({
          removeLembreteUseCase: new RemoveLembreteUseCase({ lembreteCollection, lembreteEvidenciaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/lembretes/:lembreteId'
    },
    {
      handlers: [
        authorize('update', 'Lembrete'),
        new CriaLembreteEvidenciaController({
          criaLembreteEvidenciaUseCase: new CriaLembreteEvidenciaUseCase({ lembreteEvidenciaCollection })
        })
      ],
      method: Method.Post,
      middlewares: [lembreteEvidenciaUpload],
      path: '/v2/lembretes/:lembreteId/evidencias'
    },
    {
      handlers: [
        authorize('read', 'Lembrete'),
        new ListaLembreteEvidenciasController({ lembreteEvidenciaCollection })
      ],
      method: Method.Get,
      path: '/v2/lembretes/:lembreteId/evidencias'
    },
    {
      handlers: [
        authorize('update', 'Lembrete'),
        new RemoveLembreteEvidenciaController({
          removeLembreteEvidenciaUseCase: new RemoveLembreteEvidenciaUseCase({ lembreteEvidenciaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/lembretes/:lembreteId/evidencias/:evidenciaId'
    }
  ]
}
