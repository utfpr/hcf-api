import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { RotaInput } from '@/domain/expedicao/Expedicao'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'
// import { TIPOS_USUARIOS } from '@/middlewares/tokens-middleware'
// import { UnauthorizedError } from '@/library/http/error/UnauthorizedError'

interface Dependencies {
  cadastraExpedicaoUseCase: CadastraExpedicaoUseCase
}

interface CustomHttpRequest extends HttpRequest {
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

export class CadastraExpedicaoController implements RequestHandler {
  private readonly cadastraExpedicaoUseCase: CadastraExpedicaoUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraExpedicaoUseCase = dependencies.cadastraExpedicaoUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      //  TODO: AUTENTICAÇÃO TEMPORARIAMENTE DESABILITADA
      //  A infraestrutura de request HTTP autenticada está sendo desenvolvida.
      //  Assim que integrada, descomentar a validação abaixo e remover o mock do 'created_by'.

      // if (!request.usuario || ![TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR].includes(request.usuario.tipo_usuario_id)) {
      //   return new UnauthorizedError({ message: 'Não tem permissão para realizar esta ação' })
      // }

      const {
        descricao, data_inicio, data_fim, cidade_id, participantes, rotas
      } = request.body as {
        descricao?: string | null
        data_inicio: string
        data_fim: string
        cidade_id: number
        participantes?: number[]
        rotas?: unknown[] // unknown para validarmos a estrutura abaixo
      }

      // Função que garante que a data não sofreu overflow no calendário do JS
      const isValidDate = (dateString: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
        const [
          year,
          month,
          day
        ] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      }

      // VALIDAÇÃO MANUAL DE DADOS
      if (typeof data_inicio !== 'string' || !isValidDate(data_inicio)) {
        return new BadRequestError({ message: 'A data_inicio é obrigatória e deve ser uma data válida no calendário (formato YYYY-MM-DD).' })
      }
      if (typeof data_fim !== 'string' || !isValidDate(data_fim)) {
        return new BadRequestError({ message: 'A data_fim é obrigatória e deve ser uma data válida no calendário (formato YYYY-MM-DD).' })
      }

      if (!cidade_id || !Number.isInteger(cidade_id) || cidade_id <= 0) {
        return new BadRequestError({ message: 'O cidade_id é obrigatório e deve ser um número válido.' })
      }

      if (descricao !== undefined && descricao !== null && typeof descricao !== 'string') {
        return new BadRequestError({ message: 'A descricao, se informada, deve ser um texto.' })
      }

      // VALIDAÇÃO DA ESTRUTURA DAS ROTAS
      const rotasValidadas: RotaInput[] = []

      if (rotas !== undefined) {
        if (!Array.isArray(rotas)) {
          return new BadRequestError({ message: 'O campo rotas deve ser uma lista.' })
        }

        for (const item of rotas) {
          // Garante que é um objeto não nulo e não é um array
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
      }

      const created_by = 9 // MOCK TEMPORÁRIO

      // EXECUÇÃO DO CASO DE USO
      const result = await this.cadastraExpedicaoUseCase.execute({
        descricao: descricao ?? null,
        data_inicio,
        data_fim,
        cidade_id,
        created_by,
        participantes: participantes ?? [],
        rotas: rotasValidadas
      })

      if (result.left()) {
        const error = result.value
        // Retorna 500 para falha de BD
        if (error.name === 'CollectionError' || error.message.includes('Failed to create')) {
          return new InternalServerError({ message: 'Falha interna ao cadastrar expedição' })
        }
        // Retorna 400 para erros de validação (incluindo "pertence a outra cidade")
        return new BadRequestError({ message: error.message })
      }

      return {
        statusCode: StatusCode.Created,
        body: result.value
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao cadastrar expedição'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
