import path from 'path'
import puppeteer from 'puppeteer'
import React, { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const generateFullHtmlOutput = (content: string, title: string = 'HCF') => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  ${content}
</body>
</html>`

export async function generateReport<P extends React.Attributes>(Component: ComponentType<P>, props: P) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  const htmlContent = generateFullHtmlOutput(renderToStaticMarkup(<Component {...props} />))

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
  await Promise.all([
    page.addStyleTag({
      path: path.join(__dirname, 'assets/styles/root.css')
    })
  ])

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true
  })
  
  await browser.close()

  return buffer
}
