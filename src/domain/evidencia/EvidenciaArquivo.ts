import { Either } from '@/library/either/Either'

export interface SalvaArquivoInput {
  expedicaoId: number
  eventoId: number
  mimeType: string
  contents: Buffer
}

export interface ArquivoSalvo {
  arquivo: string
  tamanho: number
}

/**
 * Port do armazenamento dos arquivos de evidência. O adapter é o único dono
 * do disco: escolhe o nome final, grava e apaga.
 */
export interface EvidenciaArquivo {
  save(input: SalvaArquivoInput): Promise<Either<Error, ArquivoSalvo>>
  remove(arquivo: string): Promise<Either<Error, void>>
}
