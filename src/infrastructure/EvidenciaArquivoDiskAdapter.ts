import { randomBytes } from 'node:crypto'
import {
  mkdir, unlink, writeFile
} from 'node:fs/promises'
import path from 'node:path'

import { EVIDENCIA_DIR, MIME_TYPE_EXTENSAO } from '@/config/evidencia'
import {
  ArquivoSalvo, EvidenciaArquivo, SalvaArquivoInput
} from '@/domain/evidencia/EvidenciaArquivo'
import { Either } from '@/library/either/Either'

import { InfrastructureError } from './error/InfrastructureError'

interface Dependencies {
  directory?: string
}

export class EvidenciaArquivoDiskAdapter implements EvidenciaArquivo {
  private readonly directory: string

  constructor(dependencies: Dependencies = {}) {
    this.directory = dependencies.directory ?? EVIDENCIA_DIR
  }

  async save(input: SalvaArquivoInput): Promise<Either<Error, ArquivoSalvo>> {
    const extensao = MIME_TYPE_EXTENSAO[input.mimeType]
    if (!extensao) {
      return Either.left(new Error(`Tipo de arquivo não suportado: ${input.mimeType}`))
    }

    const sufixo = randomBytes(2).toString('hex')
    const arquivo = `${input.expedicaoId}_${input.eventoId}_${Date.now()}-${sufixo}${extensao}`

    try {
      await mkdir(this.directory, { recursive: true })
      await writeFile(path.join(this.directory, arquivo), input.contents)
      return Either.right({ arquivo, tamanho: input.contents.length })
    } catch (error) {
      return Either.left(new InfrastructureError({ message: 'Falha ao gravar o arquivo da evidência', cause: error }))
    }
  }

  async remove(arquivo: string): Promise<Either<Error, void>> {
    try {
      await unlink(path.join(this.directory, arquivo))
      return Either.right(undefined)
    } catch (error) {
      return Either.left(new InfrastructureError({ message: 'Falha ao remover o arquivo da evidência', cause: error }))
    }
  }
}
