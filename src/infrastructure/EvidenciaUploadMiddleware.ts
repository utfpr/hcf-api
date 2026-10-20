import express from 'express'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'

import {
  EVIDENCIA_DIR, EVIDENCIA_MAX_FILE_SIZE_BYTES, LEMBRETE_EVIDENCIA_DIR, MIME_TYPE_EXTENSAO, MIME_TYPES_ACEITOS
} from '@/config/evidencia'

interface Options {
  directory: string
  // Prefixo do nome do arquivo em disco; o sufixo `_<timestamp>-<hex><extensao>` é comum a todos
  prefixo: (request: express.Request) => string
}

function createUpload({ directory, prefixo }: Options): express.RequestHandler {
  mkdirSync(directory, { recursive: true })

  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, directory)
    },
    filename: (request, file, callback) => {
      const timestamp = Date.now()
      const sufixo = randomBytes(2).toString('hex')
      const extensao = MIME_TYPE_EXTENSAO[file.mimetype]
      callback(null, `${prefixo(request)}_${timestamp}-${sufixo}${extensao}`)
    }
  })

  const singleUpload = multer({
    storage,
    limits: { fileSize: EVIDENCIA_MAX_FILE_SIZE_BYTES },
    fileFilter: (_request, file, callback) => {
      if (!MIME_TYPES_ACEITOS.includes(file.mimetype)) {
        callback(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`))
        return
      }
      callback(null, true)
    }
  }).single('arquivo')

  return (request, response, next) => {
    singleUpload(request, response, (error: unknown) => {
      if (error instanceof Error) {
        response.status(400).json({
          error: {
            statusCode: 400, name: 'BadRequestError', message: error.message
          }
        })
        return
      }
      next()
    })
  }
}

export const evidenciaUpload = createUpload({
  directory: EVIDENCIA_DIR,
  prefixo: request => `${request.evidenciaEvento?.expedicaoId}_${String(request.params.eventoId)}`
})

export const lembreteEvidenciaUpload = createUpload({
  directory: LEMBRETE_EVIDENCIA_DIR,
  prefixo: request => `lembrete_${String(request.params.lembreteId)}`
})
