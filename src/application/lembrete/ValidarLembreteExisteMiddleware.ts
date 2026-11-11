import express from 'express'

import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'

export function validarLembreteExisteMiddleware(lembreteCollection: LembreteCollection): express.RequestHandler {
  return (request, response, next) => {
    const lembreteId = Number(request.params.lembreteId)

    if (!Number.isInteger(lembreteId) || lembreteId <= 0) {
      response.status(400).json({
        error: {
          statusCode: 400, name: 'BadRequestError', message: 'lembreteId inválido'
        }
      })
      return
    }

    lembreteCollection.findById(lembreteId)
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
              statusCode: 404, name: 'NotFoundError', message: 'Lembrete não encontrado'
            }
          })
          return
        }

        next()
      })
      .catch(next)
  }
}
