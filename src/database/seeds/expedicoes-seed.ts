import { Knex } from 'knex'
import {
  mkdir, readdir, rm, writeFile
} from 'node:fs/promises'
import path from 'node:path'
import { deflateSync } from 'node:zlib'

import { EVIDENCIA_DIR } from '@/config/evidencia'
import { EventoTipo } from '@/domain/evento/Evento'
import { Logger } from '@/library/logger/Logger'

/**
 * Seed de desenvolvimento para expedições, eventos e evidências.
 *
 * Idempotência: toda expedição criada tem a descrição iniciando com SEED_PREFIXO. 
 * A cada execução elas são removidas (eventos, fichas de coleta, evidências, 
 * participantes e rotas, via ON DELETE CASCADE) e recriadas na mesma transação. 
 * Cidades existentes são reutilizadas (ou criadas se o banco estiver vazio). 
 * Usuários não são criados: o seed usa os usuários jáexistentes 
 * (ex.: do dump de desenvolvimento) e falha se não houver nenhum.
 *
 * Arquivos das evidências são gravados em EVIDENCIA_DIR (/uploads/evidencias), com prefixo SEED_ARQUIVO_PREFIXO.
 */

export const SEED_PREFIXO = '[SEED]'
const SEED_ARQUIVO_PREFIXO = 'seed_'

type Id = number

interface IdRow {
  id: Id
}

export interface ResumoSeedExpedicoes {
  expedicoesRemovidas: number
  expedicoes: number
  eventos: number
  fichasColeta: number
  evidencias: number
}


// Utilitários
function dataRelativa(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data.toISOString().slice(0, 10)
}

function momentoRelativo(dias: number, hora: number, minuto = 0): Date {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  data.setHours(hora, minuto, 0, 0)
  return data
}

async function inserirRetornandoId(trx: Knex.Transaction, tabela: string, dados: Record<string, unknown>): Promise<Id> {
  const [row] = await trx(tabela).insert(dados).returning<IdRow[]>('id')
  return Number(row.id)
}


// Arquivos fictícios para os cenários
const TABELA_CRC32 = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return c >>> 0
})

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = TABELA_CRC32[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunkPng(tipo: string, dados: Buffer): Buffer {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const tipoEDados = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(tipoEDados))
  return Buffer.concat([
    tamanho,
    tipoEDados,
    crc
  ])
}

function hexParaRgb(hex: string): number[] {
  const valor = parseInt(hex.replace('#', ''), 16)
  return [
    (valor >> 16) & 0xff,
    (valor >> 8) & 0xff,
    valor & 0xff
  ]
}

/**
 * PNG RGB com gradiente diagonal em tamanho de foto (padrão 800x600).
 */
function pngGradiente(hexInicio: string, hexFim: string, largura = 800, altura = 600): Buffer {
  const corInicio = hexParaRgb(hexInicio)
  const corFim = hexParaRgb(hexFim)
  const bytesPorLinha = 1 + largura * 3
  const pixels = Buffer.alloc(bytesPorLinha * altura)

  for (let y = 0; y < altura; y++) {
    const inicioLinha = y * bytesPorLinha
    pixels[inicioLinha] = 0
    for (let x = 0; x < largura; x++) {
      const t = (x / largura + y / altura) / 2
      const listra = Math.floor((x + y) / 40) % 2 === 0 ? 1 : 0.9
      const deslocamento = inicioLinha + 1 + x * 3
      for (let canal = 0; canal < 3; canal++) {
        const valor = corInicio[canal] + (corFim[canal] - corInicio[canal]) * t
        pixels[deslocamento + canal] = Math.round(valor * listra)
      }
    }
  }

  const cabecalho = Buffer.alloc(13)
  cabecalho.writeUInt32BE(largura, 0)
  cabecalho.writeUInt32BE(altura, 4)
  cabecalho[8] = 8
  cabecalho[9] = 2
  cabecalho[10] = 0
  cabecalho[11] = 0
  cabecalho[12] = 0

  return Buffer.concat([
    Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a
    ]),
    chunkPng('IHDR', cabecalho),
    chunkPng('IDAT', deflateSync(pixels)),
    chunkPng('IEND', Buffer.alloc(0))
  ])
}

/**
 * WAV PCM mono 16-bit com três bipes ascendentes. Duração total ~1,2s.
 */
function wavBipes(taxaAmostragem = 8000): Buffer {
  const frequencias = [
    440,
    660,
    880
  ]
  const amostrasBipe = Math.floor(taxaAmostragem * 0.3)
  const amostrasPausa = Math.floor(taxaAmostragem * 0.1)
  const amostrasFade = Math.floor(taxaAmostragem * 0.01)
  const amplitude = 0.3 * 32767

  const amostras: number[] = []
  for (const frequencia of frequencias) {
    for (let i = 0; i < amostrasBipe; i++) {
      const envelope = Math.min(1, i / amostrasFade, (amostrasBipe - 1 - i) / amostrasFade)
      amostras.push(Math.round(Math.sin((2 * Math.PI * frequencia * i) / taxaAmostragem) * amplitude * envelope))
    }
    for (let i = 0; i < amostrasPausa; i++) {
      amostras.push(0)
    }
  }

  const tamanhoDados = amostras.length * 2
  const buffer = Buffer.alloc(44 + tamanhoDados)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + tamanhoDados, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(taxaAmostragem, 24)
  buffer.writeUInt32LE(taxaAmostragem * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(tamanhoDados, 40)
  amostras.forEach((amostra, indice) => buffer.writeInt16LE(amostra, 44 + indice * 2))
  return buffer
}

async function removerArquivosSeed(): Promise<void> {
  await mkdir(EVIDENCIA_DIR, { recursive: true })
  const arquivos = await readdir(EVIDENCIA_DIR)
  await Promise.all(
    arquivos
      .filter(arquivo => arquivo.startsWith(SEED_ARQUIVO_PREFIXO))
      .map(arquivo => rm(path.join(EVIDENCIA_DIR, arquivo), { force: true }))
  )
}


// Dependências: cidades e usuários
async function obterOuCriarPorNome(
  trx: Knex.Transaction,
  tabela: string,
  filtro: Record<string, unknown>,
  dados: Record<string, unknown>
): Promise<Id> {
  const existente = await trx(tabela).where(filtro).first<IdRow | undefined>('id')
  if (existente) {
    return Number(existente.id)
  }
  return inserirRetornandoId(trx, tabela, { ...filtro, ...dados })
}

async function garantirCidades(trx: Knex.Transaction): Promise<Id[]> {
  const existentes = await trx('cidades')
    .whereNot({ nome: 'Não Informado' })
    .orderBy('id')
    .limit(3)
    .select<IdRow[]>('id')

  if (existentes.length > 0) {
    return existentes.map(cidade => Number(cidade.id))
  }

  const paisId = await obterOuCriarPorNome(trx, 'paises', { nome: 'Brasil' }, { sigla: 'BR' })
  const estadoId = await obterOuCriarPorNome(trx, 'estados', { nome: 'Paraná', pais_id: paisId }, { sigla: 'PR' })

  const cidades: Id[] = []
  for (const nome of [
    'Campo Mourão',
    'Curitiba',
    'Ponta Grossa'
  ]) {
    cidades.push(await obterOuCriarPorNome(trx, 'cidades', { nome, estado_id: estadoId }, {}))
  }
  return cidades
}

async function obterUsuarios(trx: Knex.Transaction): Promise<Id[]> {
  const existentes = await trx('usuarios')
    .orderBy('id')
    .limit(3)
    .select<IdRow[]>('id')

  if (existentes.length === 0) {
    throw new Error(
      'Nenhum usuário encontrado no banco. Importe o dump de desenvolvimento antes de rodar o seed.'
    )
  }

  return existentes.map(usuario => Number(usuario.id))
}


// Builders de domínio
interface Contexto {
  trx: Knex.Transaction
  cidades: Id[]
  usuarios: Id[]
  autor: Id
}

interface NovaExpedicao {
  descricao: string
  dataInicio: string
  dataFim: string
  quantidadeRotas: number
}

async function criarExpedicao(contexto: Contexto, dados: NovaExpedicao): Promise<Id> {
  const {
    trx, cidades, usuarios, autor
  } = contexto

  const expedicaoId = await inserirRetornandoId(trx, 'expedicoes', {
    descricao: `${SEED_PREFIXO} ${dados.descricao}`,
    data_inicio: dados.dataInicio,
    data_fim: dados.dataFim,
    cidade_id: cidades[0],
    created_by: autor,
    updated_by: autor
  })

  const rotas = Array.from({ length: dados.quantidadeRotas }, (_, indice) => ({
    expedicao_id: expedicaoId,
    cidade_id: cidades[indice % cidades.length],
    ordem: indice + 1,
    created_by: autor,
    updated_by: autor
  }))
  await trx('expedicoes_rotas').insert(rotas)

  await trx('expedicoes_participantes').insert(usuarios.map(usuarioId => ({
    expedicao_id: expedicaoId,
    usuario_id: usuarioId,
    created_by: autor,
    updated_by: autor
  })))

  return expedicaoId
}

interface NovoEvento {
  tipo: EventoTipo
  capturadoEm: Date
  latitude: number
  longitude: number
  altitude: number
  observacoes: string
}

async function criarEvento(contexto: Contexto, expedicaoId: Id, dados: NovoEvento): Promise<Id> {
  return inserirRetornandoId(contexto.trx, 'eventos', {
    expedicao_id: expedicaoId,
    tipo: dados.tipo,
    capturado_em: dados.capturadoEm,
    latitude: dados.latitude,
    longitude: dados.longitude,
    altitude: dados.altitude,
    observacoes: dados.observacoes,
    created_by: contexto.autor,
    updated_by: contexto.autor
  })
}

type FichaColeta = Record<string, string>

async function criarFichaColeta(contexto: Contexto, eventoId: Id, ficha: FichaColeta): Promise<void> {
  await contexto.trx('eventos_coletas').insert({ evento_id: eventoId, ...ficha })
}

interface NovaEvidencia {
  nome: string
  sufixoArquivo: string
  conteudo: Buffer
  mimeType: string
  capturadoEm: Date
}

async function criarEvidencia(
  contexto: Contexto,
  expedicaoId: Id,
  eventoId: Id,
  dados: NovaEvidencia
): Promise<void> {
  const arquivo = `${SEED_ARQUIVO_PREFIXO}${expedicaoId}_${eventoId}_${dados.sufixoArquivo}`
  await writeFile(path.join(EVIDENCIA_DIR, arquivo), dados.conteudo)

  await contexto.trx('evidencias').insert({
    evento_id: eventoId,
    nome: dados.nome,
    arquivo,
    mime_type: dados.mimeType,
    tamanho: dados.conteudo.length,
    capturado_em: dados.capturadoEm,
    created_by: contexto.autor,
    updated_by: contexto.autor
  })
}


// Cenários
async function cenarioSemEventos(contexto: Contexto): Promise<void> {
  await criarExpedicao(contexto, {
    descricao: 'Cenário 1 - Expedição planejada, sem eventos nem evidências',
    dataInicio: dataRelativa(15),
    dataFim: dataRelativa(20),
    quantidadeRotas: 2
  })
}

async function cenarioEventosSemEvidencias(contexto: Contexto): Promise<number> {
  const expedicaoId = await criarExpedicao(contexto, {
    descricao: 'Cenário 2 - Expedição com eventos, sem evidências',
    dataInicio: dataRelativa(-3),
    dataFim: dataRelativa(2),
    quantidadeRotas: 2
  })

  const coletaAraucaria = await criarEvento(contexto, expedicaoId, {
    tipo: 'COLETA',
    capturadoEm: momentoRelativo(-2, 9, 30),
    latitude: -24.0463,
    longitude: -52.3780,
    altitude: 630,
    observacoes: 'Indivíduo adulto com estróbilos.'
  })
  await criarFichaColeta(contexto, coletaAraucaria, {
    familia: 'Araucariaceae',
    nome_popular: 'Pinheiro-do-paraná',
    nome_cientifico: 'Araucaria angustifolia',
    municipio: 'Campo Mourão',
    estado: 'PR',
    referencia_local: 'Fragmento próximo ao campus',
    tipo_vegetacao: 'Floresta Ombrófila Mista',
    solo: 'Latossolo',
    relevo: 'Suave ondulado',
    habito: 'Árvore',
    luminosidade: 'Sol pleno'
  })

  const coletaErvaMate = await criarEvento(contexto, expedicaoId, {
    tipo: 'COLETA',
    capturadoEm: momentoRelativo(-2, 11, 0),
    latitude: -24.0478,
    longitude: -52.3795,
    altitude: 622,
    observacoes: 'Arbusto em sub-bosque, folhas coriáceas.'
  })
  await criarFichaColeta(contexto, coletaErvaMate, {
    familia: 'Aquifoliaceae',
    nome_popular: 'Erva-mate',
    nome_cientifico: 'Ilex paraguariensis',
    municipio: 'Campo Mourão',
    estado: 'PR',
    tipo_vegetacao: 'Floresta Ombrófila Mista',
    habito: 'Arbusto',
    folhas: 'Simples, alternas, margem serreada',
    luminosidade: 'Sombra'
  })

  await criarEvento(contexto, expedicaoId, {
    tipo: 'DIARIO',
    capturadoEm: momentoRelativo(-2, 16, 45),
    latitude: -24.0490,
    longitude: -52.3810,
    altitude: 615,
    observacoes: 'Tempo nublado, solo úmido. Trecho alagado após o km 2 da trilha.'
  })

  return 3
}

async function cenarioEventosComEvidencias(contexto: Contexto): Promise<{ eventos: number; evidencias: number }> {
  const expedicaoId = await criarExpedicao(contexto, {
    descricao: 'Cenário 3 - Expedição com eventos e evidências',
    dataInicio: dataRelativa(-30),
    dataFim: dataRelativa(-25),
    quantidadeRotas: 1
  })

  const coletaJucara = await criarEvento(contexto, expedicaoId, {
    tipo: 'COLETA',
    capturadoEm: momentoRelativo(-29, 10, 15),
    latitude: -25.4284,
    longitude: -49.2733,
    altitude: 920,
    observacoes: 'Palmeira com cacho de frutos maduros.'
  })
  await criarFichaColeta(contexto, coletaJucara, {
    familia: 'Arecaceae',
    nome_popular: 'Palmito-juçara',
    nome_cientifico: 'Euterpe edulis',
    municipio: 'Curitiba',
    estado: 'PR',
    tipo_vegetacao: 'Floresta Ombrófila Densa',
    relevo: 'Encosta',
    habito: 'Palmeira',
    frutos: 'Drupas globosas, roxo-escuras'
  })
  await criarEvidencia(contexto, expedicaoId, coletaJucara, {
    nome: 'Detalhe da folha',
    sufixoArquivo: 'folha.png',
    conteudo: pngGradiente('#2e7d32', '#aed581'),
    mimeType: 'image/png',
    capturadoEm: momentoRelativo(-29, 10, 20)
  })
  await criarEvidencia(contexto, expedicaoId, coletaJucara, {
    nome: 'Estipe e base',
    sufixoArquivo: 'estipe.png',
    conteudo: pngGradiente('#5d4037', '#bcaaa4'),
    mimeType: 'image/png',
    capturadoEm: momentoRelativo(-29, 10, 22)
  })

  const diario = await criarEvento(contexto, expedicaoId, {
    tipo: 'DIARIO',
    capturadoEm: momentoRelativo(-29, 17, 30),
    latitude: -25.4301,
    longitude: -49.2750,
    altitude: 905,
    observacoes: 'Registro em áudio das condições da trilha ao fim do dia.'
  })
  await criarEvidencia(contexto, expedicaoId, diario, {
    nome: 'Áudio do diário de campo',
    sufixoArquivo: 'diario.wav',
    conteudo: wavBipes(),
    mimeType: 'audio/wav',
    capturadoEm: momentoRelativo(-29, 17, 32)
  })

  return { eventos: 2, evidencias: 3 }
}


// Entrada
export async function seedExpedicoes(knex: Knex): Promise<ResumoSeedExpedicoes> {
  await removerArquivosSeed()

  return knex.transaction(async trx => {
    const expedicoesRemovidas = await trx('expedicoes')
      .where('descricao', 'like', `${SEED_PREFIXO}%`)
      .delete()

    const cidades = await garantirCidades(trx)
    const usuarios = await obterUsuarios(trx)
    const contexto: Contexto = {
      trx, cidades, usuarios, autor: usuarios[0]
    }

    await cenarioSemEventos(contexto)
    const eventosCenario2 = await cenarioEventosSemEvidencias(contexto)
    const cenario3 = await cenarioEventosComEvidencias(contexto)

    return {
      expedicoesRemovidas,
      expedicoes: 3,
      eventos: eventosCenario2 + cenario3.eventos,
      fichasColeta: 3,
      evidencias: cenario3.evidencias
    }
  })
}

export async function runExpedicoesSeed(knex: Knex, logger: Logger): Promise<void> {
  try {
    const resumo = await seedExpedicoes(knex)
    logger.info('Seed de expedições concluído', resumo)
  } catch (error) {
    logger.error('Falha ao executar o seed de expedições', error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
