import { CadastraLocalColetaUseCase } from '@/domain/localColeta/CadastraLocalColetaUseCase'
import { LocalColetaDescricaoDuplicadaError } from '@/domain/localColeta/error/LocalColetaDescricaoDuplicadaError'
import { LocalColeta } from '@/domain/localColeta/LocalColeta'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  cadastraLocalColetaUseCase: CadastraLocalColetaUseCase
}

export class CadastraLocalColetaController implements RequestHandler {
  private readonly cadastraLocalColetaUseCase: CadastraLocalColetaUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraLocalColetaUseCase = dependencies.cadastraLocalColetaUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const {
      descricao, cidade_id, fase_sucessional_id
    } = request.body as {
      descricao?: unknown
      cidade_id?: unknown
      fase_sucessional_id?: unknown
    }
    const cidadeIdValido = typeof cidade_id === 'number'
      ? Number.isInteger(cidade_id)
      : typeof cidade_id === 'string' && /^-?\d+$/.test(cidade_id)
    const faseIdValido = fase_sucessional_id === undefined
      || fase_sucessional_id === null
      || (typeof fase_sucessional_id === 'number'
        ? Number.isInteger(fase_sucessional_id)
        : typeof fase_sucessional_id === 'string' && /^-?\d+$/.test(fase_sucessional_id))

    if (typeof descricao !== 'string' || !descricao.trim() || !cidadeIdValido || !faseIdValido) {
      return new BadRequestError({ message: 'Descrição e cidade são obrigatórias; os IDs devem ser inteiros' })
    }

    const attributes = {
      descricao,
      cidade_id: Number(cidade_id),
      ...(fase_sucessional_id === undefined
        ? {}
        : { fase_sucessional_id: fase_sucessional_id === null ? null : Number(fase_sucessional_id) })
    }
    const result = await this.cadastraLocalColetaUseCase.execute(attributes)
    if (result.left()) {
      if (result.value instanceof LocalColetaDescricaoDuplicadaError) {
        return new ConflictError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    const body = localColetaBody(result.value)
    if (!body) return new InternalServerError({ message: 'Erro ao criar local de coleta' })
    return { statusCode: StatusCode.Created, body }
  }
}

function localColetaBody(localColeta: LocalColeta): LocalColeta | undefined {
  return localColeta.id === undefined ? undefined : localColeta
}
