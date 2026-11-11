import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AutorizaExpedicionarioMiddleware } from '@/application/AutorizaExpedicionarioMiddleware'
import {
  alvoPorExpedicaoDoCorpo, alvoPorLembrete, alvoPorLembreteEvidencia
} from '@/application/expedicionarioAlvos'
import { AtualizaLembreteUseCase } from '@/domain/lembrete/AtualizaLembreteUseCase'
import { CriaLembreteEvidenciaUseCase } from '@/domain/lembrete/CriaLembreteEvidenciaUseCase'
import { CriaLembreteUseCase } from '@/domain/lembrete/CriaLembreteUseCase'
import { RemoveLembreteEvidenciaUseCase } from '@/domain/lembrete/RemoveLembreteEvidenciaUseCase'
import { RemoveLembreteUseCase } from '@/domain/lembrete/RemoveLembreteUseCase'
import { lembreteEvidenciaUpload } from '@/infrastructure/EvidenciaUploadMiddleware'
import { ExpedicaoCollectionKnexAdapter } from '@/infrastructure/ExpedicaoCollectionKnexAdapter'
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
import { validarLembreteExisteMiddleware } from './ValidarLembreteExisteMiddleware'

export function routes(knex: Knex): Route[] {
  const lembreteCollection = new LembreteCollectionKnexAdapter({ knex })
  const lembreteEvidenciaCollection = new LembreteEvidenciaCollectionKnexAdapter({ knex })
  const participacao = new ExpedicaoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('read', 'Lembrete'),
        new ListaLembretesController({ lembreteCollection, lembreteEvidenciaCollection })
      ],
      method: Method.Get,
      path: '/v1/lembretes'
    },
    {
      handlers: [
        authorize('create', 'Lembrete'),
        new AutorizaExpedicionarioMiddleware({
          participacao, resolveAlvo: alvoPorExpedicaoDoCorpo(), semExpedicao: 'livre'
        }),
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
        new AutorizaExpedicionarioMiddleware({
          participacao,
          resolveAlvo: alvoPorLembrete(lembreteCollection),
          dono: { action: 'update', resource: 'Lembrete' },
          semExpedicao: 'dono'
        }),
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
        new AutorizaExpedicionarioMiddleware({
          participacao,
          resolveAlvo: alvoPorLembrete(lembreteCollection),
          dono: { action: 'delete', resource: 'Lembrete' },
          semExpedicao: 'dono'
        }),
        new RemoveLembreteController({
          removeLembreteUseCase: new RemoveLembreteUseCase({ lembreteCollection, lembreteEvidenciaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v1/lembretes/:lembreteId'
    },
    {
      handlers: [
        authorize('update', 'Lembrete'),
        // Participante anexa evidência a qualquer lembrete da expedição; no lembrete solto, só o autor.
        new AutorizaExpedicionarioMiddleware({
          participacao, resolveAlvo: alvoPorLembrete(lembreteCollection), semExpedicao: 'dono'
        }),
        new CriaLembreteEvidenciaController({
          criaLembreteEvidenciaUseCase: new CriaLembreteEvidenciaUseCase({ lembreteEvidenciaCollection })
        })
      ],
      method: Method.Post,
      middlewares: [validarLembreteExisteMiddleware(lembreteCollection), lembreteEvidenciaUpload],
      path: '/v1/lembretes/:lembreteId/evidencias'
    },
    {
      handlers: [
        authorize('read', 'Lembrete'),
        new ListaLembreteEvidenciasController({ lembreteEvidenciaCollection })
      ],
      method: Method.Get,
      path: '/v1/lembretes/:lembreteId/evidencias'
    },
    {
      handlers: [
        authorize('update', 'Lembrete'),
        new AutorizaExpedicionarioMiddleware({
          participacao,
          resolveAlvo: alvoPorLembreteEvidencia(lembreteEvidenciaCollection, lembreteCollection),
          dono: { action: 'delete', resource: 'Evidencia' },
          semExpedicao: 'livre'
        }),
        new RemoveLembreteEvidenciaController({
          removeLembreteEvidenciaUseCase: new RemoveLembreteEvidenciaUseCase({ lembreteEvidenciaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v1/lembretes/:lembreteId/evidencias/:evidenciaId'
    }
  ]
}
