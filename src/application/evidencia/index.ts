import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { CriaEvidenciaUseCase } from '@/domain/evidencia/CriaEvidenciaUseCase'
import { RemoveEvidenciaUseCase } from '@/domain/evidencia/RemoveEvidenciaUseCase'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { EvidenciaArquivoDiskAdapter } from '@/infrastructure/EvidenciaArquivoDiskAdapter'
import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'
import { evidenciaUpload } from '@/infrastructure/EvidenciaUploadMiddleware'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { CriaEvidenciaController } from './CriaEvidenciaController'
import { ListaEvidenciasController } from './ListaEvidenciasController'
import { RemoveEvidenciaController } from './RemoveEvidenciaController'

export function routes(knex: Knex): Route[] {
  const evidenciaCollection = new EvidenciaCollectionKnexAdapter({ knex })
  const eventoCollection = new EventoCollectionKnexAdapter({ knex })
  const evidenciaArquivo = new EvidenciaArquivoDiskAdapter()
  const logger = new ConsoleLogger()

  return [
    {
      handlers: [
        authorize('create', 'Evidencia'),
        new CriaEvidenciaController({
          criaEvidenciaUseCase: new CriaEvidenciaUseCase({
            eventoCollection, evidenciaCollection, evidenciaArquivo, logger
          })
        })
      ],
      method: Method.Post,
      middlewares: [evidenciaUpload],
      path: '/v1/eventos/:eventoId/evidencias'
    },
    {
      handlers: [
        authorize('read', 'Evidencia'),
        new ListaEvidenciasController({ evidenciaCollection })
      ],
      method: Method.Get,
      path: '/v1/eventos/:eventoId/evidencias'
    },
    {
      handlers: [
        authorize('delete', 'Evidencia'),
        new RemoveEvidenciaController({
          removeEvidenciaUseCase: new RemoveEvidenciaUseCase({
            evidenciaArquivo, evidenciaCollection, logger
          })
        })
      ],
      method: Method.Delete,
      path: '/v1/evidencias/:evidenciaId'
    }
  ]
}
