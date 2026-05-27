import parser from 'body-parser'
import makeCors from 'cors'
import express from 'express'
import makeHelmet from 'helmet'
import morgan from 'morgan'
// import swaggerUi from 'swagger-ui-express'

import { Method } from '@/library/http/common'
import { RequestHandler, Server } from '@/library/http/Server'

import { assets, upload } from '../config/directory'
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
  server: Server
  routes: Route[]
  legacyRouter?: unknown
  cors: CorsParameters
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

export class Application {
  private readonly server: Server
  private readonly routes: Route[]
  private readonly legacyRouter?: unknown

  constructor({
    server, routes,
    legacyRouter, cors
  }: Parameters) {
    this.server = server
    this.routes = routes
    this.legacyRouter = legacyRouter

    this.setup({ cors })
  }

  private setup({ cors }: { cors: CorsParameters }): void {
    this.server
      .use(makeHelmet(securityConfig))
      .use(makeCors({
        origin: cors.origins,
        methods: cors.methods,
        allowedHeaders: cors.allowedHeaders
      }))
      .use(parser.json())
      .use(morgan('dev'))
      // .use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
      .use('/fotos', express.static(upload))
      .use('/assets', express.static(assets))
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
    this.server.use('/reports', reportsRouter)

    for (const route of this.routes) {
      this.server.endpoint(route.method, route.path, ...route.handlers)
    }

    if (this.legacyRouter) {
      this.server.mount(this.legacyRouter)
    }

    this.server.use(legacyErrors)
  }

  async start(port: number): Promise<void> {
    await this.server.start(port)
  }
}
