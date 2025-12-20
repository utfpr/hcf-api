import axios from 'axios'
import dotenv from 'dotenv'
import pLimit from 'p-limit'
import path from 'path'
import { Client } from 'pg'
import { fileURLToPath } from 'url'
import wkx from 'wkx'

interface MunicipioIBGE {
  id: number
  nome: string
  nome_normalizado: string
}

interface MunicipioIBGEResponse {
  id: number
  nome: string
}

interface Cidade {
  id: number
  nome: string
  pol_wkb: Buffer | null
}

interface ResultadoProcessamento {
  inserido: number
  atualizado: number
  erro: number
}

const currentFilename = fileURLToPath(import.meta.url)
const currentDirname = path.dirname(currentFilename)
const projectRoot = path.resolve(currentDirname, '..', '..', '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const {
  PG_DATABASE,
  PG_USERNAME,
  PG_PASSWORD,
  PG_HOST,
  PG_PORT,
  DATABASE_URL
} = process.env

const connectionString
  = DATABASE_URL
    || `postgresql://${PG_USERNAME}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}`

function isValidConnectionString(cs: string | undefined): boolean {
  return typeof cs === 'string' && cs.length > 0 && !/undefined/.test(cs)
}

if (!isValidConnectionString(connectionString)) {
  process.exit(1)
}

const API_IBGE_MUNICIPIOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios'
const API_IBGE_POLYGON
  = 'https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{codigo_ibge}?formato=application/vnd.geo+json&qualidade=minima'

const MAX_CONCURRENCY = 10
const REQUEST_DELAY_MS = 150

function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function carregarListaMunicipios(): Promise<MunicipioIBGE[]> {
  const resp = await axios.get<MunicipioIBGEResponse[]>(API_IBGE_MUNICIPIOS, { timeout: 30000 })
  return resp.data.map((m: MunicipioIBGEResponse) => ({
    id: m.id,
    nome: m.nome,
    nome_normalizado: removerAcentos(m.nome.toLowerCase())
  }))
}

function obterCodigoIbge(nome: string, municipios: MunicipioIBGE[]): number | null {
  const nomeNorm = removerAcentos(nome.toLowerCase())
  const m = municipios.find(x => x.nome_normalizado === nomeNorm)
  return m ? parseInt(String(m.id), 10) : null
}

async function obterPoligonoIbge(codigoIbge: number): Promise<Buffer> {
  const url = API_IBGE_POLYGON.replace('{codigo_ibge}', String(codigoIbge))
  const resp = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 30000
  })

  const txt = Buffer.from(resp.data).toString('utf-8')
  const geojson = JSON.parse(txt) as { features: Array<{ geometry: unknown }> }

  if (!geojson?.features?.length) {
    throw new Error(`GeoJSON vazio para codigo ${codigoIbge}`)
  }

  const { geometry } = geojson.features[0]
  if (!geometry) {
    throw new Error(`Sem geometria no GeoJSON para codigo ${codigoIbge}`)
  }

  const geom = wkx.Geometry.parseGeoJSON(geometry)
  return geom.toWkb()
}

async function processarCidade(
  client: Client,
  municipios: MunicipioIBGE[],
  cidade: Cidade
): Promise<ResultadoProcessamento> {
  const {
    id, nome, pol_wkb: polWkb
  } = cidade

  if (nome === 'Não Informado') {
    return {
      inserido: 0, atualizado: 0, erro: 0
    }
  }

  const codigoIbge = obterCodigoIbge(nome, municipios)
  if (!codigoIbge) {
    return {
      inserido: 0, atualizado: 0, erro: 1
    }
  }

  let polBytes: Buffer
  try {
    polBytes = await obterPoligonoIbge(codigoIbge)
  } catch {
    return {
      inserido: 0, atualizado: 0, erro: 1
    }
  }

  const sql = `
    WITH newgeom AS (
      SELECT ST_Multi(ST_SetSRID(ST_GeomFromWKB($1::bytea, 4674), 4674)) AS g
    )
    UPDATE public.cidades
    SET poligono = (SELECT g FROM newgeom), updated_at = NOW()
    WHERE id = $2
    AND (poligono IS NULL OR NOT ST_Equals(poligono, (SELECT g FROM newgeom)));
  `

  try {
    const result = await client.query(sql, [polBytes, id])
    if (result && result.rowCount && result.rowCount > 0) {
      return polWkb
        ? {
            inserido: 0, atualizado: 1, erro: 0
          }
        : {
            inserido: 1, atualizado: 0, erro: 0
          }
    }
    return {
      inserido: 0, atualizado: 0, erro: 0
    }
  } catch {
    return {
      inserido: 0, atualizado: 0, erro: 1
    }
  }
}

async function main(): Promise<void> {
  const municipios = await carregarListaMunicipios()
  const client = new Client({ connectionString })
  await client.connect()

  const limit = pLimit(MAX_CONCURRENCY)

  try {
    const { rows: cidades } = await client.query<Cidade>(
      'SELECT c.id, c.nome, ST_AsBinary(c.poligono) AS pol_wkb FROM public.cidades c JOIN public.estados e ON c.estado_id = e.id WHERE e.pais_id = 76;'
    )

    const tarefas = cidades.map(c =>
      limit(async () => {
        const res = await processarCidade(client, municipios, c)
        await delay(REQUEST_DELAY_MS)
        return res
      })
    )

    await Promise.all(tarefas)
  } finally {
    await client.end()
  }
}

main().catch(() => process.exit(1))
