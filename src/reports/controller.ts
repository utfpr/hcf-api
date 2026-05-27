import { Request, Response } from 'express'
import { ComponentType } from 'react'

import { resolveSource } from '@/config/directory'
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATES: Record<string, ComponentType<any>> = {
  InventarioEspecies,
  LocaisColeta,
  RelacaoFamiliasGenero,
  RelacaoFamiliasGeneroQtd,
  RelacaoTombos,
  RelacaoTombosComColeta
}

export function reportPreview(_: Request, response: Response) {
  response.sendFile(resolveSource('reports/preview.html'))
}

export async function generatePreview(request: Request, response: Response) {
  try {
    const fileName = request.params.fileName as string
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
