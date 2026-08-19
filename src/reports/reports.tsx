import { resolveSource } from '@/config/directory'
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

export async function generateReport<P extends React.Attributes>(Component: ComponentType<P>, props: P, options?: { titulo?: string }) {
  const { titulo = 'HCF' } = options || {}

  const htmlContent = generateFullHtmlOutput(renderToStaticMarkup(<Component {...props} />),
    titulo
  )

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined

  try {
    // --single-process/--no-zygote crash current Chrome in containers (TargetCloseError).
    browser = await puppeteer.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
      ]
    })
    const page = await browser.newPage()

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })
    await page.addStyleTag({
      path: resolveSource('reports/assets/styles/root.css')
    })

    const date = new Date().toLocaleDateString('pt-BR')

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 120000,
      margin: {
        top: '0',
        right: '0',
        bottom: '50px',
        left: '0'
      },
      displayHeaderFooter: true,
      footerTemplate: `
      <div style="width: 100%; font-size: 10px; padding: 0 20px; color: #555; display: flex; justify-content: space-between; align-items: center;">
        <span>${date}</span>
        <div>
          <span class="pageNumber"></span>/<span class="totalPages"></span>
        </div>
      </div>
    `,
      headerTemplate: `<div></div>`
    })
  } finally {
    await browser?.close()
  }
}
