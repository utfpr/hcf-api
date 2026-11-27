import { Either } from '@/library/either/Either'

/**
 * Parâmetros requeridos para salvar um arquivo físico de evidência no disco.
 */
export interface SalvaArquivoInput {
  expedicaoId: number
  eventoId: number
  mimeType: string
  contents: Buffer
}

/**
 * Metadados retornados após o salvamento do arquivo em disco.
 */
export interface ArquivoSalvo {
  arquivo: string
  tamanho: number
}

/**
 * Port do armazenamento dos arquivos de evidência. O adapter é o único dono
 * do disco: escolhe o nome final, grava e apaga.
 */
export interface EvidenciaArquivo {
  /**
   * Grava o buffer em disco em diretório estruturado e retorna o nome final e tamanho do arquivo.
   *
   * @param input Dados do arquivo e identificadores da expedição/evento.
   * @returns Either com os metadados do arquivo salvo ou erro de I/O.
   */
  save(input: SalvaArquivoInput): Promise<Either<Error, ArquivoSalvo>>

  /**
   * Remove fisicamente o arquivo do disco.
   *
   * @param arquivo Nome do arquivo a ser excluído.
   * @returns Either void indicando sucesso ou erro de I/O.
   */
  remove(arquivo: string): Promise<Either<Error, void>>
}
