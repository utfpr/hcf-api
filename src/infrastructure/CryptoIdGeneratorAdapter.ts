import { randomUUID } from 'node:crypto'

import { IdGenerator } from '@/domain/evidencia/Transcricao'

export class CryptoIdGeneratorAdapter implements IdGenerator {
  generate(): string {
    return randomUUID()
  }
}
