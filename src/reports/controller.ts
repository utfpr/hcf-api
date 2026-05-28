import { Request, Response } from 'express'
import path from 'path'
import { ComponentType } from 'react'

import { generateReport } from '@/reports/reports'
import InventarioEspecies from '@/reports/templates/InventarioEspecies'
import LocaisColeta from '@/reports/templates/LocaisColeta'
import RelacaoFamiliasGenero from '@/reports/templates/RelacaoFamiliasGenero'
import RelacaoFamiliasGeneroQtd from '@/reports/templates/RelacaoFamiliasGeneroQtd'
import RelacaoTombos from '@/reports/templates/RelacaoTombos'
import RelacaoTombosComColeta from '@/reports/templates/RelacaoTombosComColeta'

// Static map of allowed templates – prevents runtime path traversal and lets
// esbuild bundle the templates into the main output instead of requiring
// separate compiled files alongside the bundle.
const TEMPLATES: Record<string, ComponentType> = {
  InventarioEspecies,
  LocaisColeta,
  RelacaoFamiliasGenero,
  RelacaoFamiliasGeneroQtd,
  RelacaoTombos,
  RelacaoTombosComColeta
}

// preview.html is a static file served from the project root; its path is
// resolved via process.cwd() so it works both in dev (tsx) and in the bundle.
const PREVIEW_HTML = path.resolve('src/reports/preview.html')

export function reportPreview(_: Request, response: Response) {
  response.sendFile(PREVIEW_HTML)
}

export async function generatePreview(request: Request, response: Response) {
  try {
    const { fileName } = request.params
    const ReportTemplate = TEMPLATES[fileName]

    if (!ReportTemplate) {
      response.status(404).send(`Report template "${fileName}" not found`)
      return
    }

    const buffer = await generateReport(ReportTemplate, request.body ?? {})
    response.setHeader('Content-Type', 'application/pdf')
    response.end(buffer)
  } catch (error) {
    console.warn(error) // eslint-disable-line no-console
    response.status(500).send('Failed to generate report')
  }
}
