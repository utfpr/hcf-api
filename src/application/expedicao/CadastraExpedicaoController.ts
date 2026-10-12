import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
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
        rotas?: number[]
      }

      // VALIDAÇÃO MANUAL DE DADOS
      if (!data_inicio || Number.isNaN(Date.parse(data_inicio))) {
        return new BadRequestError({ message: 'A data_inicio é obrigatória e deve ser uma data válida (ex: YYYY-MM-DD).' })
      }

      if (!data_fim || Number.isNaN(Date.parse(data_fim))) {
        return new BadRequestError({ message: 'A data_fim é obrigatória e deve ser uma data válida (ex: YYYY-MM-DD).' })
      }

      if (!cidade_id || typeof cidade_id !== 'number' || cidade_id <= 0) {
        return new BadRequestError({ message: 'O cidade_id é obrigatório e deve ser um número válido.' })
      }

      if (descricao !== undefined && descricao !== null && typeof descricao !== 'string') {
        return new BadRequestError({ message: 'A descricao, se informada, deve ser um texto.' })
      }

      // MOCK TEMPORÁRIO: Substituir pelo request.usuario.id quando a autenticação estiver pronta
      const created_by = 9 // Id válido de usuário para teste

      // EXECUÇÃO DO CASO DE USO
      const result = await this.cadastraExpedicaoUseCase.execute({
        descricao: descricao ?? null,
        data_inicio,
        data_fim,
        cidade_id,
        created_by,
        participantes: participantes ?? [],
        rotas: rotas ?? []
      })

      if (result.left()) {
        // Se for um erro que sabemos ser de banco/infraestrutura devolve 500
        if (result.value.name === 'CollectionError' || result.value.message.includes('Failed to create')) {
          return new InternalServerError({ message: 'Falha interna ao cadastrar expedição' })
        }

        // Se for um erro de validação de domínio (ex: data_fim antes de data_inicio) devolve 400
        return new BadRequestError({ message: result.value.message })
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
