import { resolve } from 'node:path'

import { upload } from './directory'

export const EVIDENCIA_DIR = resolve(upload, 'evidencias')
export const LEMBRETE_EVIDENCIA_DIR = resolve(upload, 'lembretes')

const DEFAULT_MAX_FILE_SIZE_MB = 200
const maxFileSizeMb = Number(process.env.EVIDENCIA_MAX_FILE_SIZE_MB) || DEFAULT_MAX_FILE_SIZE_MB
export const EVIDENCIA_MAX_FILE_SIZE_BYTES = maxFileSizeMb * 1024 * 1024

export const MIME_TYPE_EXTENSAO: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/wav': '.wav'
}

export const MIME_TYPES_ACEITOS = Object.keys(MIME_TYPE_EXTENSAO)

// Lembrete só aceita foto
export const LEMBRETE_MIME_TYPE_EXTENSAO: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
}

export const LEMBRETE_MIME_TYPES_ACEITOS = Object.keys(LEMBRETE_MIME_TYPE_EXTENSAO)
