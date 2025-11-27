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

export async function generateReport<P extends React.Attributes>(Component: ComponentType<P>, props: P, options?: { titulo?: string }) {
  const { titulo = 'HCF' } = options || {}

  const htmlContent = generateFullHtmlOutput(renderToStaticMarkup(<Component {...props} />),
    titulo
  )

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Avoid /dev/shm usage
      '--disable-accelerated-2d-canvas',
      '--disable-gpu', // GPU not typically available in containers
      '--no-zygote', // Disable Chrome zygote process
      '--single-process', // Run in single process mode
      '--no-first-run',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-features=site-per-process,TranslateUI,BlinkGenPropertyTrees',
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

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
  await Promise.all([
    page.addStyleTag({
      path: path.join(__dirname, 'assets/styles/root.css')
    })
  ])

  const date = new Date().toLocaleDateString('pt-BR')

  const buffer = await page.pdf({
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

  await browser.close()

  return buffer
}
