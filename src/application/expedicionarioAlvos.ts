import { type ResolveAlvo } from '@/application/AutorizaExpedicionarioMiddleware'
import { type EventoCollection } from '@/domain/evento/EventoCollection'
import { type EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { type LembreteCollection } from '@/domain/lembrete/LembreteCollection'
import { type LembreteEvidenciaCollection } from '@/domain/lembrete/LembreteEvidenciaCollection'

/*
 * Resolvedores de alvo do AutorizaExpedicionarioMiddleware.
 * Id inválido ou registro inexistente devolve undefined: a resposta 400/404 fica a cargo do controller.
 */

function idPositivo(raw: unknown): number | undefined {
  const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : undefined
}

function param(request: Parameters<ResolveAlvo>[0], nome: string): number | undefined {
  return idPositivo((request.params)[nome])
}

/**
 * Cria resolvedor de alvo baseado no parâmetro ':expedicaoId' presente na rota.
 *
 * @returns Função ResolveAlvo que extrai a expedição dos parâmetros da requisição.
 */
export function alvoPorExpedicaoDaRota(): ResolveAlvo {
  return request => {
    const expedicaoId = param(request, 'expedicaoId')
    return Promise.resolve(expedicaoId === undefined ? undefined : { expedicaoId })
  }
}

/**
 * Cria resolvedor de alvo a partir do parâmetro ':eventoId', obtendo a expedição associada e o autor do evento.
 *
 * @param eventoCollection Repositório para consulta de eventos.
 * @returns Função ResolveAlvo correspondente ao evento ou erro de infraestrutura.
 */
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

/**
 * Cria resolvedor de alvo a partir de ':evidenciaId', consultando a evidência e seu evento associado
 * para determinar a expedição e o usuário criador.
 *
 * @param evidenciaCollection Repositório para consulta de evidências.
 * @param eventoCollection Repositório para consulta de eventos.
 * @returns Função ResolveAlvo correspondente à evidência e ao evento pai ou erro de infraestrutura.
 */
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

/**
 * Cria resolvedor de alvo a partir do campo 'expedicao_id' presente no corpo da requisição JSON (ex.: POST /v1/lembretes).
 * Caso o campo seja omitido, nulo ou vazio, retorna expedicaoId como null (lembrete solto/sem expedição).
 *
 * @returns Função ResolveAlvo baseada no payload da requisição.
 */
export function alvoPorExpedicaoDoCorpo(): ResolveAlvo {
  return request => {
    const raw = ((request.body ?? {}) as Record<string, unknown>).expedicao_id
    if (raw === undefined || raw === null || raw === '') return Promise.resolve({ expedicaoId: null })

    const expedicaoId = idPositivo(raw)
    return Promise.resolve(expedicaoId === undefined ? undefined : { expedicaoId })
  }
}

/**
 * Cria resolvedor de alvo a partir do parâmetro ':lembreteId', obtendo a expedição vinculada e o criador do lembrete.
 *
 * @param lembreteCollection Repositório para consulta de lembretes.
 * @returns Função ResolveAlvo correspondente ao lembrete ou erro de infraestrutura.
 */
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

/**
 * Cria resolvedor de alvo para evidência de lembrete (:evidenciaId e :lembreteId),
 * obtendo a autoria da evidência e a do lembrete pai para validação hierárquica.
 *
 * @param lembreteEvidenciaCollection Repositório para consulta de evidências de lembrete.
 * @param lembreteCollection Repositório para consulta de lembretes.
 * @returns Função ResolveAlvo correspondente ou erro de infraestrutura.
 */
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
