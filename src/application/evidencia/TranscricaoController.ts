import { TranscricaoError } from '@/domain/evidencia/error/TranscricaoError'
import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import {
  TranscreveEvidencia, TranscricaoCollection
} from '@/domain/evidencia/Transcricao'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

/**
 * Controller responsável pelos endpoints de gerenciamento do ciclo de vida de transcrição de áudio:
 * - GET: consulta transcrição existente;
 * - POST: solicita geração assíncrona de transcrição;
 * - PATCH: submete revisão de texto com controle de versão otimista.
 */
export class TranscricaoController implements RequestHandler {
  /**
   * @param dependencies Repositórios de evidência e transcrição, caso de uso de transcrição e ação executada.
   */
  constructor(private readonly dependencies: {
    evidencias: EvidenciaCollection
    transcricoes: TranscricaoCollection
    transcreve: TranscreveEvidencia
    action: 'read' | 'generate' | 'revise'
  }) {}

  /**
   * Processa a leitura, solicitação de geração ou revisão de transcrição.
   *
   * @param request Requisição HTTP com ':id' da evidência e corpo para revisão quando aplicável.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com a transcrição ou HttpError (400, 401, 404, 409, 415, 500).
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const raw = request.params.id
      const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN
      if (!Number.isSafeInteger(id) || id <= 0) throw new TranscricaoError(400, 'id_invalido', 'ID da evidência inválido.')
      const {
        evidencias, transcricoes, transcreve, action
      } = this.dependencies
      const evidencia = await evidencias.findById(id)
      if (evidencia.left()) throw evidencia.value
      if (!evidencia.value) throw new TranscricaoError(404, 'evidencia_nao_encontrada', 'Evidência não encontrada.')
      if (action === 'read') return { statusCode: StatusCode.Ok, body: await transcricoes.find(id) }
      if (!request.user) throw new TranscricaoError(401, 'nao_autorizado', 'Autenticação necessária.')
      if (action === 'generate') {
        return { statusCode: StatusCode.Ok, body: await transcreve.execute(evidencia.value, request.user.id) }
      }
      const body = request.body as { texto_revisado?: unknown; versao?: unknown } | null
      if (typeof body?.texto_revisado !== 'string' || !body.texto_revisado.trim()
        || typeof body.versao !== 'number' || !Number.isSafeInteger(body.versao) || body.versao < 1) {
        throw new TranscricaoError(400, 'revisao_invalida', 'Informe texto_revisado não vazio e a versão da transcrição.')
      }
      const atual = await transcricoes.find(id)
      if (atual?.status !== 'concluida') throw new TranscricaoError(409, 'transcricao_nao_concluida', 'A transcrição ainda não foi concluída.')
      // Controle de concorrência otimista: valida se a versão informada no corpo confere com a atual antes de persistir a revisão
      if (!await transcricoes.revise(id, body.versao, body.texto_revisado.trim(), request.user.id)) {
        throw new TranscricaoError(409, 'versao_conflitante', 'Outra pessoa alterou esta transcrição. Recarregue antes de salvar sua correção.')
      }
      return { statusCode: StatusCode.Ok, body: await transcricoes.find(id) }
    } catch (error) {
      if (error instanceof TranscricaoError) {
        return new HttpError({
          statusCode: error.statusCode, type: error.code, message: error.message
        })
      }
      return new HttpError({
        statusCode: 500, type: 'falha_interna', message: 'Não foi possível acessar a transcrição.'
      })
    }
  }
}
