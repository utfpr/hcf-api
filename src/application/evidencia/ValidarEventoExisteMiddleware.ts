import express from 'express'

import { EventoCollection } from '@/domain/evento/EventoCollection'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- é o jeito canônico de estender o Request do Express
  namespace Express {
    interface Request {
      evidenciaEvento?: { expedicaoId: number }
    }
  }
}

export function validarEventoExisteMiddleware(eventoCollection: EventoCollection): express.RequestHandler {
  return (request, response, next) => {
    const eventoId = Number(request.params.eventoId)

    if (!Number.isInteger(eventoId) || eventoId <= 0) {
      response.status(400).json({
        error: {
          statusCode: 400, name: 'BadRequestError', message: 'eventoId inválido'
        }
      })
      return
    }

    eventoCollection.findById(eventoId)
      .then(result => {
        if (result.left()) {
          response.status(500).json({
            error: {
              statusCode: 500, name: 'InternalServerError', message: result.value.message
            }
          })
          return
        }

        if (!result.value) {
          response.status(404).json({
            error: {
              statusCode: 404, name: 'NotFoundError', message: 'Evento não encontrado'
            }
          })
          return
        }

        request.evidenciaEvento = { expedicaoId: result.value.expedicao_id }
        next()
      })
      .catch(next)
  }
}
