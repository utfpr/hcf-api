import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { TranscricaoCollection } from '@/domain/evidencia/Transcricao'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  evidenciaCollection: EvidenciaCollection
  transcricoes?: TranscricaoCollection
}

export class ListaEvidenciasController implements RequestHandler {
  private readonly transcricoes?: TranscricaoCollection
  private readonly evidenciaCollection: EvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.evidenciaCollection = dependencies.evidenciaCollection
    this.transcricoes = dependencies.transcricoes
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId } = request.params as { eventoId?: string }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const result = await this.evidenciaCollection.findAll({ evento_id: eventoId })
    if (result.left()) return new InternalServerError({ message: result.value.message })

    let resumos: Awaited<ReturnType<TranscricaoCollection['summaries']>> = new Map()
    try {
      if (this.transcricoes) resumos = await this.transcricoes.summaries(result.value.map(evidencia => evidencia.id))
    } catch {
      return new InternalServerError({ message: 'Não foi possível carregar as transcrições.' })
    }
    const body = result.value.map(evidencia => ({
      ...evidencia,
      transcricao: resumos.get(evidencia.id) ?? null,
      url: `/uploads/evidencias/${evidencia.arquivo}`
    }))

    return { body, statusCode: StatusCode.Ok }
  }
}

function parseId(raw: unknown, field: string): number | Error {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return new Error(`${field} inválido`)
  }
  return Number(raw)
}
