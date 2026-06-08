import makeCors from 'cors'
import express from 'express'
import makeHelmet from 'helmet'
import morgan from 'morgan'
// import swaggerUi from 'swagger-ui-express'

import { Application } from '@/library/Application'
import { Method } from '@/library/http/common'
import { RequestHandler } from '@/library/http/Server'

import { upload } from '../config/directory'
// import swaggerSpec from '../config/swagger'
import legacyErrors from '../middlewares/erros-middleware'
import { generatePreview, reportPreview } from '../reports/controller'

export interface Route {
  method: Method
  path: string
  handlers: RequestHandler[]
}

interface CorsParameters {
  origins: string[]
  methods: string[]
  allowedHeaders: string[]
}

interface Parameters {
  application: Application
  routes: Route[]
  cors: CorsParameters
  legacyRouter?: unknown
}

const securityConfig = {
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['"self"'],
      styleSrc: ['"self"', '"unsafe-inline"'],
      scriptSrc: ['"self"'],
      imgSrc: [
        '"self"',
        '"data:"',
        '"https:"'
      ]
    }
  }
}

export class Kernel {
  readonly application: Application
  readonly routes: Route[]
  private readonly legacyRouter?: unknown

  constructor({
    application, routes,
    legacyRouter, cors
  }: Parameters) {
    this.application = application
    this.routes = routes
    this.legacyRouter = legacyRouter

    this.setup({ cors })
  }

  private setup({ cors }: { cors: CorsParameters }): void {
    this.application
      .use(makeHelmet(securityConfig))
      .use(makeCors({
        origin: cors.origins,
        methods: cors.methods,
        allowedHeaders: cors.allowedHeaders
      }))
      .use(morgan('dev'))
      // .use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
      // .use('/fotos', express.static(upload))
      // .use('/assets', express.static(assets))
      .use(
        '/uploads',
        express.static(upload, {
          index: false,
          redirect: false,
          setHeaders: res => {
            res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
          }
        })
      )

    const reportsRouter = express.Router()
    reportsRouter.get('/:fileName', reportPreview)
    reportsRouter.post('/:fileName', generatePreview)
    this.application.use('/reports', reportsRouter)

    for (const route of this.routes) {
      const sanitizedPath = `/api/${route.path}`.replaceAll(/\/{2,}/g, '/').replaceAll(/\/$/g, '')
      this.application.endpoint(route.method, sanitizedPath, ...route.handlers)
    }

    if (this.legacyRouter) {
      this.application.use(this.legacyRouter)
    }

    this.application.use(legacyErrors)
  }

  async start(port: number): Promise<void> {
    await this.application.start(port)
  }
}
