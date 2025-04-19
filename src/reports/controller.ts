import { Request, Response } from 'express'
import path from 'path'

import { generateReport } from '~/reports/reports'

export function reportPreview(_: Request, response: Response) {
  response.sendFile(path.join(__dirname, '../reports/preview.html'))
}

export async function generatePreview(request: Request, response: Response) {
  try {
    const { fileName } = request.params
    const { default: ReportTemplate } = await import(path.join(__dirname, `../reports/templates/${fileName}`))

    const buffer = await generateReport(ReportTemplate, request.body ?? {})
    response.setHeader('Content-Type', 'application/pdf')
    response.end(buffer)
  } catch (error) {
    console.warn(error)
    response.status(500).send('Failed to generate report')
  }
}
