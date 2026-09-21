import { AtualizaExpedicaoUseCase } from '@/domain/expedicao/AtualizaExpedicaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  atualizaExpedicaoUseCase: AtualizaExpedicaoUseCase
}

interface CustomHttpRequest extends HttpRequest {
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

export class AtualizaExpedicaoController implements RequestHandler {
  private readonly atualizaExpedicaoUseCase: AtualizaExpedicaoUseCase

  constructor(dependencies: Dependencies) {
    this.atualizaExpedicaoUseCase = dependencies.atualizaExpedicaoUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId } = request.params
      const id = Number(expedicaoId)

      if (!expedicaoId || Number.isNaN(id)) {
        return new BadRequestError({ message: 'O ID da expedição é inválido.' })
      }

      const {
        descricao, data_inicio, data_fim, cidade_id
      } = request.body as {
        descricao: string | null
        data_inicio: string
        data_fim: string
        cidade_id: number
      }

      const DATA = /^\d{4}-\d{2}-\d{2}$/

      if (typeof data_inicio !== 'string' || !DATA.test(data_inicio) || Number.isNaN(Date.parse(data_inicio))) {
        return new BadRequestError({ message: 'A data_inicio é obrigatória e deve estar no formato YYYY-MM-DD.' })
      }
      if (typeof data_fim !== 'string' || !DATA.test(data_fim) || Number.isNaN(Date.parse(data_fim))) {
        return new BadRequestError({ message: 'A data_fim é obrigatória e deve estar no formato YYYY-MM-DD.' })
      }
      if (!Number.isInteger(cidade_id) || cidade_id <= 0) {
        return new BadRequestError({ message: 'O cidade_id é obrigatório e deve ser um número inteiro válido.' })
      }
      if (descricao !== undefined && descricao !== null && typeof descricao !== 'string') {
        return new BadRequestError({ message: 'A descricao, se informada, deve ser um texto.' })
      }

      const updated_by = 10 // MOCK TEMPORÁRIO, trocar por request.usuario.id

      const result = await this.atualizaExpedicaoUseCase.execute(id, {
        descricao: descricao ?? null,
        data_inicio,
        data_fim,
        cidade_id,
        updated_by
      })

      if (result.left()) {
        return new BadRequestError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.Ok,
        body: result.value
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao atualizar expedição'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
