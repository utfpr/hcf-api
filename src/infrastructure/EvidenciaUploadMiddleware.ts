import express from 'express'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'

import {
  EVIDENCIA_MAX_FILE_SIZE_BYTES, LEMBRETE_EVIDENCIA_DIR, LEMBRETE_MIME_TYPE_EXTENSAO,
  LEMBRETE_MIME_TYPES_ACEITOS, MIME_TYPES_ACEITOS
} from '@/config/evidencia'

function createUpload(
  storage: multer.StorageEngine,
  mimeTypesAceitos: string[],
  mensagemTipoInvalido: (mimetype: string) => string
): express.RequestHandler {
  const singleUpload = multer({
    storage,
    limits: { fileSize: EVIDENCIA_MAX_FILE_SIZE_BYTES },
    fileFilter: (_request, file, callback) => {
      if (!mimeTypesAceitos.includes(file.mimetype)) {
        callback(new Error(mensagemTipoInvalido(file.mimetype)))
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

// O arquivo fica em memória até o use case confirmar o evento; quem grava em
// disco é o EvidenciaArquivo, depois do authorize e da validação.
export const evidenciaUpload = createUpload(
  multer.memoryStorage(),
  MIME_TYPES_ACEITOS,
  mimetype => `Tipo de arquivo não suportado: ${mimetype}`
)

mkdirSync(LEMBRETE_EVIDENCIA_DIR, { recursive: true })

export const lembreteEvidenciaUpload = createUpload(
  multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, LEMBRETE_EVIDENCIA_DIR)
    },
    filename: (request, file, callback) => {
      const timestamp = Date.now()
      const sufixo = randomBytes(2).toString('hex')
      const extensao = LEMBRETE_MIME_TYPE_EXTENSAO[file.mimetype]
      callback(null, `lembrete_${String(request.params.lembreteId)}_${timestamp}-${sufixo}${extensao}`)
    }
  }),
  LEMBRETE_MIME_TYPES_ACEITOS,
  mimetype => `Lembrete aceita apenas fotos (jpeg, png ou webp): ${mimetype}`
)
