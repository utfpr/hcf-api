import { type Knex } from 'knex'

import { CriarEvidenciaUseCase } from '@/domain/evidencia/CriarEvidenciaUseCase'
import { EventoCollectionKnexAdapter } from '@/infrastructure/EventoCollectionKnexAdapter'
import { EvidenciaCollectionKnexAdapter } from '@/infrastructure/EvidenciaCollectionKnexAdapter'
import { evidenciaUpload } from '@/infrastructure/EvidenciaUploadMiddleware'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { CriarEvidenciaController } from './CriarEvidenciaController'
import { ListarEvidenciasController } from './ListarEvidenciasController'
import { validarEventoExisteMiddleware } from './ValidarEventoExisteMiddleware'

export function routes(knex: Knex): Route[] {
  const evidenciaCollection = new EvidenciaCollectionKnexAdapter({ knex })
  const eventoCollection = new EventoCollectionKnexAdapter({ knex })

  return [
    {
      handlers: [
        new CriarEvidenciaController({
          criarEvidenciaUseCase: new CriarEvidenciaUseCase({ evidenciaCollection })
        })
      ],
      method: Method.Post,
      middlewares: [validarEventoExisteMiddleware(eventoCollection), evidenciaUpload],
      path: '/v2/eventos/:eventoId/evidencias'
    },
    {
      handlers: [new ListarEvidenciasController({ evidenciaCollection })],
      method: Method.Get,
      path: '/v2/eventos/:eventoId/evidencias'
    }
  ]
}
