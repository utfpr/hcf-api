/* eslint-disable no-console */
import dotenv from 'dotenv'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

type TomboFoto = {
  id: number
  codigo_barra: string | null
  caminho_foto: string | null
}

type ImageFile = {
  fileName: string
  fullPath: string
  codigoBarra: string
}

type UpdatedTomboFoto = {
  id: number
  codigo_barra: string | null
  caminho_foto: string | null
}

type ReportItem = Record<string, unknown>

type Report = {
  metadata: {
    dryRun: boolean
    apply: boolean
    imageSource: string
    imageDir: string | null
    imageListFile: string | null
    reportDir: string
    generatedAt: string
    allowedExtensions: string[]
  }
  summary: Record<string, number>
  atualizaveis: ReportItem[]
  atualizados: ReportItem[]
  sem_alteracao: ReportItem[]
  arquivos_duplicados_por_codigo_barra: ReportItem[]
  arquivos_sem_registro_tombo_foto: ReportItem[]
  tombos_sem_imagem_e_sem_caminho_foto: ReportItem[]
  tombos_sem_imagem_mas_com_caminho_foto: ReportItem[]
  erros: ReportItem[]
}

const currentFilename = fileURLToPath(import.meta.url)
const currentDirname = path.dirname(currentFilename)
const projectRoot = path.resolve(currentDirname, '..', '..', '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const allowedExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.tiff',
  '.svg'
]

function normalizeCodigoBarra(value: string | null | undefined): string {
  return String(value || '').trim().toUpperCase()
}

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`
  const argWithEquals = process.argv.find(arg => arg.startsWith(prefix))
  if (argWithEquals) return argWithEquals.slice(prefix.length)

  const index = process.argv.indexOf(name)
  if (index >= 0) return process.argv[index + 1]

  return undefined
}

function hasArg(name: string): boolean {
  return process.argv.includes(name)
}

function printUsage(): void {
  console.log(`
    Uso:
      npm run fotos:sync -- --dir /caminho/das/imagens
      npm run fotos:sync -- --file src/utils/scripts/storage-cm-prod.txt
      npm run fotos:sync -- --dir /caminho/das/imagens --apply

    Opcoes:
      --dir <path>          Diretorio com as imagens a reconciliar.
      --file <path>         Arquivo texto com a lista de imagens, uma por linha.
      --report-dir <path>   Diretorio para salvar o relatorio. Padrao: storage/reports.
      --apply               Aplica as atualizacoes no banco. Sem isso, roda em dry-run.
      --help                Mostra esta ajuda.
  `)
}

function getConnectionString(): string {
  const {
    PG_DATABASE,
    PG_USERNAME,
    PG_PASSWORD,
    PG_HOST,
    PG_PORT,
    DATABASE_URL
  } = process.env
  const connectionString = DATABASE_URL || `postgresql://${PG_USERNAME}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}`

  if (!connectionString || connectionString.includes('undefined')) {
    throw new Error('Configuracao de banco invalida. Informe DATABASE_URL ou PG_* no .env.')
  }

  return connectionString
}

function buildImageFile(fileNameOrPath: string, fullPath: string): ImageFile {
  const fileName = path.basename(fileNameOrPath)
  const extension = path.extname(fileName).toLowerCase()
  const nameWithoutExtension = extension
    ? fileName.slice(0, -extension.length)
    : fileName

  return {
    fileName,
    fullPath,
    codigoBarra: normalizeCodigoBarra(nameWithoutExtension)
  }
}

function isAllowedImage(image: ImageFile): boolean {
  return allowedExtensions.includes(path.extname(image.fileName).toLowerCase()) && image.codigoBarra.length > 0
}

function readImagesFromDirectory(imageDir: string): ImageFile[] {
  return readdirSync(imageDir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => buildImageFile(entry.name, path.join(imageDir, entry.name)))
    .filter(isAllowedImage)
}

function readImagesFromFile(imageListFile: string): ImageFile[] {
  return readFileSync(imageListFile, 'utf-8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => buildImageFile(line, line))
    .filter(isAllowedImage)
}

function groupImagesByCodigoBarra(images: ImageFile[]): Map<string, ImageFile[]> {
  const grouped = new Map<string, ImageFile[]>()

  for (const image of images) {
    const group = grouped.get(image.codigoBarra) || []
    group.push(image)
    grouped.set(image.codigoBarra, group)
  }

  return grouped
}

function createReport(
  dryRun: boolean,
  imageSource: string,
  imageDir: string | null,
  imageListFile: string | null,
  reportDir: string
): Report {
  return {
    metadata: {
      dryRun,
      apply: !dryRun,
      imageSource,
      imageDir,
      imageListFile,
      reportDir,
      generatedAt: new Date().toISOString(),
      allowedExtensions
    },
    summary: {},
    atualizaveis: [],
    atualizados: [],
    sem_alteracao: [],
    arquivos_duplicados_por_codigo_barra: [],
    arquivos_sem_registro_tombo_foto: [],
    tombos_sem_imagem_e_sem_caminho_foto: [],
    tombos_sem_imagem_mas_com_caminho_foto: [],
    erros: []
  }
}

async function loadTombosFotos(client: Client): Promise<TomboFoto[]> {
  const result = await client.query<TomboFoto>(`
    SELECT id, codigo_barra, caminho_foto
    FROM public.tombos_fotos
    WHERE codigo_barra IS NOT NULL
    ORDER BY codigo_barra, id;
  `)

  return result.rows
}

function refreshSummary(report: Report): void {
  report.summary = {
    atualizaveis: report.atualizaveis.length,
    atualizados: report.atualizados.length,
    sem_alteracao: report.sem_alteracao.length,
    arquivos_duplicados_por_codigo_barra: report.arquivos_duplicados_por_codigo_barra.length,
    arquivos_sem_registro_tombo_foto: report.arquivos_sem_registro_tombo_foto.length,
    tombos_sem_imagem_e_sem_caminho_foto: report.tombos_sem_imagem_e_sem_caminho_foto.length,
    tombos_sem_imagem_mas_com_caminho_foto: report.tombos_sem_imagem_mas_com_caminho_foto.length,
    erros: report.erros.length
  }
}

function buildReport(
  tombosFotos: TomboFoto[],
  groupedImages: Map<string, ImageFile[]>,
  imageSource: string,
  imageDir: string | null,
  imageListFile: string | null,
  dryRun: boolean,
  reportDir: string
): Report {
  const report = createReport(dryRun, imageSource, imageDir, imageListFile, reportDir)
  const tombosByCodigoBarra = new Map<string, TomboFoto[]>()

  for (const tomboFoto of tombosFotos) {
    const codigoBarra = normalizeCodigoBarra(tomboFoto.codigo_barra)
    const group = tombosByCodigoBarra.get(codigoBarra) || []
    group.push(tomboFoto)
    tombosByCodigoBarra.set(codigoBarra, group)
  }

  for (const [codigoBarra, images] of groupedImages.entries()) {
    const tombos = tombosByCodigoBarra.get(codigoBarra)

    if (images.length > 1) {
      report.arquivos_duplicados_por_codigo_barra.push({
        codigo_barra: codigoBarra,
        arquivos: images.map(image => image.fileName),
        origens: images.map(image => image.fullPath)
      })
      continue
    }

    if (!tombos || tombos.length === 0) {
      report.arquivos_sem_registro_tombo_foto.push({
        codigo_barra: codigoBarra,
        arquivo: images[0].fileName,
        origem: images[0].fullPath
      })
    }
  }

  for (const tomboFoto of tombosFotos) {
    const codigoBarra = normalizeCodigoBarra(tomboFoto.codigo_barra)
    const images = groupedImages.get(codigoBarra) || []

    if (images.length > 1) continue

    if (images.length === 1) {
      const image = images[0]
      const currentFile = String(tomboFoto.caminho_foto || '').trim()

      if (currentFile === image.fileName) {
        report.sem_alteracao.push({
          id: tomboFoto.id,
          codigo_barra: tomboFoto.codigo_barra,
          caminho_foto: tomboFoto.caminho_foto
        })
      } else {
        report.atualizaveis.push({
          id: tomboFoto.id,
          codigo_barra: tomboFoto.codigo_barra,
          caminho_foto_atual: tomboFoto.caminho_foto,
          caminho_foto_novo: image.fileName,
          origem: image.fullPath
        })
      }

      continue
    }

    if (!tomboFoto.caminho_foto || tomboFoto.caminho_foto.trim().length === 0) {
      report.tombos_sem_imagem_e_sem_caminho_foto.push({
        id: tomboFoto.id,
        codigo_barra: tomboFoto.codigo_barra
      })
      continue
    }

    report.tombos_sem_imagem_mas_com_caminho_foto.push({
      id: tomboFoto.id,
      codigo_barra: tomboFoto.codigo_barra,
      caminho_foto: tomboFoto.caminho_foto,
      caminho_foto_existe_no_diretorio: imageDir
        ? existsSync(path.join(imageDir, tomboFoto.caminho_foto))
        : null
    })
  }

  refreshSummary(report)
  return report
}

async function applyUpdates(client: Client, report: Report): Promise<void> {
  const rows = report.atualizaveis

  if (rows.length === 0) return

  const values: string[] = []
  const params: unknown[] = []

  rows.forEach((row, index) => {
    const idParam = index * 2 + 1
    const caminhoParam = index * 2 + 2
    values.push(`($${idParam}::integer, $${caminhoParam}::text)`)
    params.push(row.id, row.caminho_foto_novo)
  })

  await client.query('BEGIN')

  try {
    const result = await client.query<UpdatedTomboFoto>(
      `
        UPDATE public.tombos_fotos AS tf
        SET caminho_foto = data.caminho_foto,
            updated_at = NOW()
        FROM (VALUES ${values.join(', ')}) AS data(id, caminho_foto)
        WHERE tf.id = data.id
        RETURNING tf.id, tf.codigo_barra, tf.caminho_foto;
      `,
      params
    )

    report.atualizados = result.rows.map(row => ({
      id: row.id,
      codigo_barra: row.codigo_barra,
      caminho_foto: row.caminho_foto
    }))

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

function writeReport(report: Report): string {
  mkdirSync(report.metadata.reportDir, { recursive: true })

  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
  const suffix = report.metadata.dryRun ? 'dry-run' : 'apply'
  const reportPath = path.join(report.metadata.reportDir, `sync-tombo-fotos-${suffix}-${timestamp}.json`)

  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

  return reportPath
}

function printSummary(report: Report, reportPath: string): void {
  console.log(`Modo: ${report.metadata.dryRun ? 'dry-run' : 'apply'}`)
  console.log(`Origem das imagens: ${report.metadata.imageSource}`)
  console.log(`Relatorio: ${reportPath}`)
  console.table(report.summary)
}

function resolveInput(): { imageDir: string | null; imageListFile: string | null; imageSource: string } {
  const dirArg = getArgValue('--dir')
  const fileArg = getArgValue('--file')

  if ((!dirArg && !fileArg) || (dirArg && fileArg)) {
    printUsage()
    throw new Error('Informe exatamente uma origem: --dir ou --file.')
  }

  const imageDir = dirArg ? path.resolve(dirArg) : null
  const imageListFile = fileArg ? path.resolve(fileArg) : null

  if (imageDir && (!existsSync(imageDir) || !statSync(imageDir).isDirectory())) {
    throw new Error(`Diretorio de imagens nao encontrado: ${imageDir}`)
  }

  if (imageListFile && (!existsSync(imageListFile) || !statSync(imageListFile).isFile())) {
    throw new Error(`Arquivo de lista de imagens nao encontrado: ${imageListFile}`)
  }

  return {
    imageDir,
    imageListFile,
    imageSource: imageDir || imageListFile || ''
  }
}

async function main(): Promise<void> {
  if (hasArg('--help')) {
    printUsage()
    return
  }

  const {
    imageDir, imageListFile, imageSource
  } = resolveInput()
  const reportDirArg = getArgValue('--report-dir')
  const dryRun = !hasArg('--apply')
  const reportDir = path.resolve(reportDirArg || path.join(projectRoot, 'storage', 'reports'))
  const images = imageDir ? readImagesFromDirectory(imageDir) : readImagesFromFile(imageListFile as string)
  const groupedImages = groupImagesByCodigoBarra(images)
  const client = new Client({ connectionString: getConnectionString() })

  await client.connect()

  try {
    const tombosFotos = await loadTombosFotos(client)
    const report = buildReport(tombosFotos, groupedImages, imageSource, imageDir, imageListFile, dryRun, reportDir)

    if (!dryRun) {
      await applyUpdates(client, report)
      refreshSummary(report)
    }

    const reportPath = writeReport(report)
    printSummary(report, reportPath)
  } finally {
    await client.end()
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
