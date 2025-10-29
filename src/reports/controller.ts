import { Request, Response } from 'express'
import path from 'path'
import { ComponentType } from 'react'

import { generateReport } from '@/reports/reports'

export function reportPreview(_: Request, response: Response) {
  response.sendFile(path.join(__dirname, '../reports/preview.html'))
}

export async function generatePreview(request: Request, response: Response) {
  try {
    const { fileName } = request.params
    const { default: ReportTemplate } = await import(path.join(__dirname, `../reports/templates/${fileName}`)) as { default: ComponentType }

    const buffer = await generateReport(ReportTemplate, request.body ?? {})
    response.setHeader('Content-Type', 'application/pdf')
    response.end(buffer)
  } catch (error) {
    console.warn(error) // eslint-disable-line no-console
    response.status(500).send('Failed to generate report')
  }
}
