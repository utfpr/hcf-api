import express from 'express'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'

import {
  EVIDENCIA_DIR, EVIDENCIA_MAX_FILE_SIZE_BYTES, MIME_TYPE_EXTENSAO, MIME_TYPES_ACEITOS
} from '@/config/evidencia'

mkdirSync(EVIDENCIA_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, EVIDENCIA_DIR)
  },
  filename: (request, file, callback) => {
    const eventoId = String(request.params.eventoId)
    const expedicaoId = request.evidenciaEvento?.expedicaoId
    const timestamp = Date.now()
    const sufixo = randomBytes(2).toString('hex')
    const extensao = MIME_TYPE_EXTENSAO[file.mimetype]
    callback(null, `${expedicaoId}_${eventoId}_${timestamp}-${sufixo}${extensao}`)
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

export const evidenciaUpload: express.RequestHandler = (request, response, next) => {
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
