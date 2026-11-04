import express from 'express'

import { assets, upload } from '@/config/directory'

const staticOptions = {
  index: false,
  redirect: false,
  setHeaders: (res: express.Response) => {
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  }
}

interface Mountable {
  use(path: string, handler: express.RequestHandler): unknown
}

export function mountPublicStatic(application: Mountable): void {
  const assetsStatic = express.static(assets, staticOptions)
  const uploadsStatic = express.static(upload, staticOptions)
  application.use('/assets', assetsStatic)
  application.use('/api/assets', assetsStatic)
  application.use('/uploads', uploadsStatic)
  application.use('/api/uploads', uploadsStatic)
}
