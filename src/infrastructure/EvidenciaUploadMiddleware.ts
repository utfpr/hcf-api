import express from 'express'
import multer from 'multer'

import {
  EVIDENCIA_MAX_FILE_SIZE_BYTES, MIME_TYPES_ACEITOS
} from '@/config/evidencia'

// O arquivo fica em memória até o use case confirmar o evento; quem grava em
// disco é o EvidenciaArquivo, depois do authorize e da validação.
const storage = multer.memoryStorage()

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
