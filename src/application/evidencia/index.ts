import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { CriaEvidenciaUseCase } from '@/domain/evidencia/CriaEvidenciaUseCase'
import { RemoveEvidenciaUseCase } from '@/domain/evidencia/RemoveEvidenciaUseCase'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'
import { evidenciaUpload } from '@/infrastructure/EvidenciaUploadMiddleware'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { CriaEvidenciaController } from './CriaEvidenciaController'
import { ListaEvidenciasController } from './ListaEvidenciasController'
import { RemoveEvidenciaController } from './RemoveEvidenciaController'
import { validaEventoExisteMiddleware } from './ValidaEventoExisteMiddleware'

export function routes(knex: Knex): Route[] {
  const evidenciaCollection = new EvidenciaCollectionKnexAdapter({ knex })
  const eventoCollection = new EventoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        authorize('create', 'Evidencia'),
        new CriaEvidenciaController({
          criaEvidenciaUseCase: new CriaEvidenciaUseCase({ evidenciaCollection })
        })
      ],
      method: Method.Post,
      middlewares: [validaEventoExisteMiddleware(eventoCollection), evidenciaUpload],
      path: '/v2/eventos/:eventoId/evidencias'
    },
    {
      handlers: [
        authorize('read', 'Evidencia'),
        new ListaEvidenciasController({ evidenciaCollection })
      ],
      method: Method.Get,
      path: '/v2/eventos/:eventoId/evidencias'
    },
    {
      handlers: [
        authorize('delete', 'Evidencia'),
        new RemoveEvidenciaController({
          removeEvidenciaUseCase: new RemoveEvidenciaUseCase({ evidenciaCollection })
        })
      ],
      method: Method.Delete,
      path: '/v2/evidencias/:evidenciaId'
    }
  ]
}
