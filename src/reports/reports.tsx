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
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
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

  const htmlContent = generateFullHtmlOutput(renderToStaticMarkup(<Component {...props} />))

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
  await Promise.all([
    page.addStyleTag({
      path: path.join(__dirname, 'assets/styles/root.css')
    })
  ])

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    timeout: 120000
  })

  await browser.close()

  return buffer
}
