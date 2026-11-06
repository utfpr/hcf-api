import { Knex } from 'knex'

import { Transcricao, TranscricaoCollection } from '@/domain/evidencia/Transcricao'

export class TranscricaoCollectionKnexAdapter implements TranscricaoCollection {
  constructor(private readonly knex: Knex) {}

  async find(id: number): Promise<Transcricao | null> {
    const row = await this.knex('evidencias_transcricoes as t')
      .leftJoin('usuarios as gerador', 'gerador.id', 't.gerado_por')
      .leftJoin('usuarios as revisor', 'revisor.id', 't.revisado_por')
      .select('t.*', 'gerador.nome as gerado_por_nome', 'revisor.nome as revisado_por_nome')
      .where('t.evidencia_id', id).first<Transcricao>()
    if (!row) return null
    return {
      evidencia_id: row.evidencia_id,
      status: row.status,
      texto_original: row.texto_original,
      texto_revisado: row.texto_revisado,
      versao: row.versao,
      gerado_por: row.gerado_por === null ? null : Number(row.gerado_por),
      gerado_por_nome: row.gerado_por_nome,
      gerado_em: row.gerado_em,
      revisado_por: row.revisado_por === null ? null : Number(row.revisado_por),
      revisado_por_nome: row.revisado_por_nome,
      revisado_em: row.revisado_em,
      codigo_erro: row.codigo_erro,
      processamento_expira_em: row.processamento_expira_em
    }
  }

  async summaries(ids: number[]): Promise<Map<number, Pick<Transcricao, 'status' | 'versao'>>> {
    if (!ids.length) return new Map()
    const rows = await this.knex<Transcricao>('evidencias_transcricoes').select('evidencia_id', 'status', 'versao').whereIn('evidencia_id', ids)
    return new Map(rows.map(row => [row.evidencia_id, { status: row.status, versao: row.versao }]))
  }

  async claim(id: number, tentativa: string, usuarioId: number, leaseMs: number): Promise<boolean> {
    return this.knex.transaction(async trx => {
      // Serialize only the reservation, including the first request where no transcription row exists.
      const evidencia = await trx('evidencias').where({ id }).forUpdate().first<{ id: number }>()
      if (!evidencia) return false
      const atual = await trx('evidencias_transcricoes').where({ evidencia_id: id }).first<Transcricao>()
      const now = new Date()
      if (atual?.status === 'concluida'
        || (atual?.status === 'processando' && atual.processamento_expira_em !== null && new Date(atual.processamento_expira_em).getTime() > now.getTime())) return false
      const values = {
        status: 'processando',
        tentativa,
        gerado_por: usuarioId,
        processamento_expira_em: new Date(now.getTime() + leaseMs),
        codigo_erro: null
      }
      if (atual) await trx('evidencias_transcricoes').where({ evidencia_id: id }).update(values)
      else await trx('evidencias_transcricoes').insert({ evidencia_id: id, ...values })
      return true
    })
  }

  async complete(id: number, tentativa: string, texto: string): Promise<boolean> {
    const count = await this.knex('evidencias_transcricoes')
      .where({
        evidencia_id: id, tentativa, status: 'processando'
      })
      .where('processamento_expira_em', '>', this.knex.fn.now())
      .update({
        status: 'concluida', texto_original: texto, gerado_em: this.knex.fn.now(), versao: 1, processamento_expira_em: null
      })
    return count > 0
  }

  async fail(id: number, tentativa: string, codigo: string): Promise<void> {
    await this.knex('evidencias_transcricoes').where({
      evidencia_id: id, tentativa, status: 'processando'
    })
      .update({
        status: 'erro', codigo_erro: codigo, processamento_expira_em: null
      })
  }

  async revise(id: number, versao: number, texto: string, usuarioId: number): Promise<boolean> {
    const count = await this.knex('evidencias_transcricoes').where({
      evidencia_id: id, versao, status: 'concluida'
    })
      .update({
        texto_revisado: texto, revisado_por: usuarioId, revisado_em: this.knex.fn.now(), versao: versao + 1
      })
    return count > 0
  }
}
