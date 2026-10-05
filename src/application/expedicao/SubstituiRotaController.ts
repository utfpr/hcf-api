import { RotaInput } from '@/domain/expedicao/Expedicao'
import { SubstituiRotasUseCase } from '@/domain/expedicao/SubstituiRotaUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  SubstituiRotasUseCase: SubstituiRotasUseCase
}

interface CustomHttpRequest extends HttpRequest {
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

export class SubstituiRotasController implements RequestHandler {
  private readonly SubstituiRotasUseCase: SubstituiRotasUseCase

  constructor(dependencies: Dependencies) {
    this.SubstituiRotasUseCase = dependencies.SubstituiRotasUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId } = request.params
      const { rotas } = request.body as { rotas?: unknown }

      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || typeof expedicaoId !== 'string' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'expedicaoId inválido' })
      }

      if (!rotas || !Array.isArray(rotas)) {
        return new BadRequestError({ message: 'O campo rotas é obrigatório e deve ser uma lista.' })
      }

      // VALIDAÇÃO DA ESTRUTURA DAS ROTAS
      const rotasValidadas: RotaInput[] = []

      for (const item of rotas) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          return new BadRequestError({ message: 'Cada rota deve ser um objeto válido.' })
        }

        const rotaObj = item as Record<string, unknown>

        if (typeof rotaObj.cidade_id !== 'number' || rotaObj.cidade_id <= 0) {
          return new BadRequestError({ message: 'Cada rota deve conter um cidade_id numérico válido.' })
        }

        let locaisIds: number[] = []
        if (rotaObj.locais_coleta_ids !== undefined) {
          if (!Array.isArray(rotaObj.locais_coleta_ids) || rotaObj.locais_coleta_ids.some(id => typeof id !== 'number' || id <= 0)) {
            return new BadRequestError({ message: 'O campo locais_coleta_ids deve ser uma lista de números inteiros.' })
          }
          locaisIds = rotaObj.locais_coleta_ids as number[]
        }

        rotasValidadas.push({ cidade_id: rotaObj.cidade_id, locais_coleta_ids: locaisIds })
      }

      const result = await this.SubstituiRotasUseCase.execute(Number(expedicaoId), rotasValidadas)

      if (result.left()) {
        const error = result.value
        // Erro 404
        if (error.message === 'Expedição não encontrada') {
          return { statusCode: StatusCode.NotFound, body: { error: { message: error.message } } }
        }
        // Erro de BD (500)
        if (error.name === 'CollectionError' || error.message.includes('Falha ao substituir')) {
          return new InternalServerError({ message: 'Falha interna ao substituir rotas' })
        }
        // Erro de Negócio como localidade errada (400)
        return new BadRequestError({ message: error.message })
      }

      return {
        statusCode: StatusCode.NoContent,
        body: undefined
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao substituir rotas'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
