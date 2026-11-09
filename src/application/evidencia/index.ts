import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { CriaEvidenciaUseCase } from '@/domain/evidencia/CriaEvidenciaUseCase'
import { RemoveEvidenciaUseCase } from '@/domain/evidencia/RemoveEvidenciaUseCase'
import { TranscreveEvidencia } from '@/domain/evidencia/Transcricao'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'
import { CryptoIdGeneratorAdapter } from '@/infrastructure/CryptoIdGeneratorAdapter'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { EvidenciaArquivoDiskAdapter } from '@/infrastructure/EvidenciaArquivoDiskAdapter'
import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'
import { evidenciaUpload } from '@/infrastructure/EvidenciaUploadMiddleware'
import { SpeechToTextAdapter } from '@/infrastructure/SpeechToTextAdapter'
import { TranscricaoCollectionKnexAdapter } from '@/infrastructure/TranscricaoCollectionKnexAdapter'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { CriaEvidenciaController } from './CriaEvidenciaController'
import { ListaEvidenciasController } from './ListaEvidenciasController'
import { RemoveEvidenciaController } from './RemoveEvidenciaController'
import { TranscricaoController } from './TranscricaoController'

export function routes(knex: Knex): Route[] {
  const evidenciaCollection = new EvidenciaCollectionKnexAdapter({ knex })
  const eventoCollection = new EventoCollectionKnexAdapter({ knex })
  const evidenciaArquivo = new EvidenciaArquivoDiskAdapter()
  const logger = new ConsoleLogger()

  const transcricoes = new TranscricaoCollectionKnexAdapter(knex)
  const transcreve = new TranscreveEvidencia({
    collection: transcricoes,
    transcriber: new SpeechToTextAdapter(),
    idGenerator: new CryptoIdGeneratorAdapter(),
    logger
  })
  const transcricaoRoutes: Route[] = ([
    {
      method: Method.Get, action: 'read', permission: 'read'
    },
    {
      method: Method.Post, action: 'generate', permission: 'update'
    },
    {
      method: Method.Patch, action: 'revise', permission: 'update'
    }
  ] as const).map(({
    method, action, permission
  }) => ({
    method,
    path: '/v1/evidencias/:id/transcricao',
    handlers: [
      authorize(permission, 'Evidencia'),
      new TranscricaoController({
        evidencias: evidenciaCollection, transcricoes, transcreve, action
      })
    ]
  }))

  return [
    ...transcricaoRoutes,
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
        new ListaEvidenciasController({ evidenciaCollection, transcricoes })
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
