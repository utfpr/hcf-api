import { type ResolveAlvo } from '@/application/AutorizaExpedicionarioMiddleware'
import { type EventoCollection } from '@/domain/evento/EventoCollection'
import { type EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { type LembreteCollection } from '@/domain/lembrete/LembreteCollection'
import { type LembreteEvidenciaCollection } from '@/domain/lembrete/LembreteEvidenciaCollection'

/*
 * Resolvedores de alvo do AutorizaExpedicionarioMiddleware. Id inválido ou
 * registro inexistente devolve undefined: quem responde 400/404 é o controller.
 */

function idPositivo(raw: unknown): number | undefined {
  const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : undefined
}

function param(request: Parameters<ResolveAlvo>[0], nome: string): number | undefined {
  return idPositivo((request.params)[nome])
}

export function alvoPorExpedicaoDaRota(): ResolveAlvo {
  return request => {
    const expedicaoId = param(request, 'expedicaoId')
    return Promise.resolve(expedicaoId === undefined ? undefined : { expedicaoId })
  }
}

export function alvoPorEvento(eventoCollection: EventoCollection): ResolveAlvo {
  return async request => {
    const eventoId = param(request, 'eventoId')
    if (eventoId === undefined) return undefined

    const evento = await eventoCollection.findById(eventoId)
    if (evento.left()) return evento.value
    if (!evento.value) return undefined

    return { expedicaoId: evento.value.expedicao_id, criadoPor: evento.value.created_by }
  }
}

export function alvoPorEvidencia(
  evidenciaCollection: EvidenciaCollection,
  eventoCollection: EventoCollection
): ResolveAlvo {
  return async request => {
    const evidenciaId = param(request, 'evidenciaId')
    if (evidenciaId === undefined) return undefined

    const evidencia = await evidenciaCollection.findById(evidenciaId)
    if (evidencia.left()) return evidencia.value
    if (!evidencia.value) return undefined

    const evento = await eventoCollection.findById(evidencia.value.evento_id)
    if (evento.left()) return evento.value
    if (!evento.value) return undefined

    return { expedicaoId: evento.value.expedicao_id, criadoPor: evidencia.value.created_by }
  }
}

/** POST /v1/lembretes: a expedição vem do corpo; sem ela o lembrete é solto. */
export function alvoPorExpedicaoDoCorpo(): ResolveAlvo {
  return request => {
    const raw = ((request.body ?? {}) as Record<string, unknown>).expedicao_id
    if (raw === undefined || raw === null || raw === '') return Promise.resolve({ expedicaoId: null })

    const expedicaoId = idPositivo(raw)
    return Promise.resolve(expedicaoId === undefined ? undefined : { expedicaoId })
  }
}

export function alvoPorLembrete(lembreteCollection: LembreteCollection): ResolveAlvo {
  return async request => {
    const lembreteId = param(request, 'lembreteId')
    if (lembreteId === undefined) return undefined

    const lembrete = await lembreteCollection.findById(lembreteId)
    if (lembrete.left()) return lembrete.value
    if (!lembrete.value) return undefined

    return { expedicaoId: lembrete.value.expedicao_id ?? null, criadoPor: lembrete.value.created_by }
  }
}

export function alvoPorLembreteEvidencia(
  lembreteEvidenciaCollection: LembreteEvidenciaCollection,
  lembreteCollection: LembreteCollection
): ResolveAlvo {
  return async request => {
    const evidenciaId = param(request, 'evidenciaId')
    const lembreteId = param(request, 'lembreteId')
    if (evidenciaId === undefined || lembreteId === undefined) return undefined

    const evidencia = await lembreteEvidenciaCollection.findById(evidenciaId)
    if (evidencia.left()) return evidencia.value
    if (!evidencia.value || evidencia.value.lembrete_id !== lembreteId) return undefined

    const lembrete = await lembreteCollection.findById(lembreteId)
    if (lembrete.left()) return lembrete.value
    if (!lembrete.value) return undefined

    return {
      expedicaoId: lembrete.value.expedicao_id ?? null,
      criadoPor: evidencia.value.created_by,
      criadoPorPai: lembrete.value.created_by
    }
  }
}
