import { Either } from '@/library/either/Either'

/**
 * Atributos que definem a entidade FaseSucessional.
 */
export interface Attributes {
  id?: string
  nome: string
}

/**
 * Entidade de domínio que representa o estágio ou fase sucessional da vegetação.
 */
export class FaseSucessional {
  readonly id?: string
  readonly nome: string

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.nome = attributes.nome
  }

  /**
   * Fábrica para criar e validar uma instância de FaseSucessional.
   *
   * @param attributes Dados para instanciação incluindo nome e id opcional.
   * @returns Either com a entidade criada ou erro de validação (nome vazio ou ID inválido).
   */
  static create(attributes: { nome: string; id?: string }): Either<Error, FaseSucessional> {
    const nome = attributes.nome.trim()

    if (!nome) {
      return Either.left(new Error('Nome da fase sucessional não pode ser vazio'))
    }

    if (attributes.id !== undefined && !isPositiveId(attributes.id)) {
      return Either.left(new Error('id da fase sucessional deve ser um inteiro positivo'))
    }

    return Either.right(new FaseSucessional({
      id: attributes.id,
      nome
    }))
  }
}

/**
 * Verifica se a string representa um identificador inteiro positivo.
 *
 * @param id Identificador em string.
 * @returns true se for um inteiro positivo.
 */
function isPositiveId(id: string): boolean {
  return /^\d+$/.test(id) && BigInt(id) > 0n
}
