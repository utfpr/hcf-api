import express from 'express'

import { LembreteCollection } from '@/domain/lembrete/LembreteCollection'

/**
 * Middleware pré-upload que valida a existência prévia do lembrete no banco de dados.
 * Posicionado antes do Multer para evitar que arquivos de evidência sejam gravados em disco
 * caso o lembrete de destino não exista.
 *
 * @param lembreteCollection Repositório para consulta do lembrete.
 * @returns Middleware Express que prossegue caso o lembrete exista ou responde 400/404/500.
 */
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
