import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  evidenciaCollection: EvidenciaCollection
}

export class ListarEvidenciasController implements RequestHandler {
  private readonly evidenciaCollection: EvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.evidenciaCollection = dependencies.evidenciaCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId } = request.params as { eventoId?: string }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const result = await this.evidenciaCollection.findAll({ evento_id: eventoId })
    if (result.left()) return new InternalServerError({ message: result.value.message })

    const body = result.value.map(evidencia => ({
      ...evidencia,
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
