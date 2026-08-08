import makeCors from 'cors'
import express from 'express'
import makeHelmet from 'helmet'
import { Knex } from 'knex'
import morgan from 'morgan'

import { ExpressApplication } from '@/infrastructure/ExpressApplication'
import { StatusCode } from '@/library/http/common'
import { Route } from '@/library/http/Router'
import { Logger } from '@/library/logger/Logger'

import { upload } from '../config/directory'
import legacyErrors from '../middlewares/erros-middleware'
import { generatePreview, reportPreview } from '../reports/controller'
import { routes as createEstadoRoutes } from './estado'
import { routes as createPaisRoutes } from './pais'

interface CorsParameters {
  origins: string[]
  methods: string[]
  allowedHeaders: string[]
}

interface Parameters {
  logger: Logger
  cors: CorsParameters
  knex: Knex
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

export function createApp({
  logger, cors, knex, legacyRouter
}: Parameters) {
  const routes: Route[] = [
    ...createPaisRoutes(knex),
    ...createEstadoRoutes(knex)
  ]
  const application = new ExpressApplication({ logger })

  application
    .use(makeHelmet(securityConfig))
    .use(makeCors({
      origin: cors.origins,
      methods: cors.methods,
      allowedHeaders: cors.allowedHeaders
    }))
    .use(morgan('dev'))
    .get('/health', {
      handle() {
        return Promise.resolve({
          statusCode: StatusCode.Ok,
          body: { status: 'ok' }
        })
      }
    })
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
  application.use('/reports', reportsRouter)

  for (const route of routes) {
    const sanitizedPath = `/api/${route.path}`.replaceAll(/\/{2,}/g, '/').replaceAll(/\/$/g, '')
    application.endpoint(route.method, sanitizedPath, ...route.handlers)
  }

  if (legacyRouter) {
    application.use('/api', legacyRouter)
  }
  application.use(legacyErrors)

  return application
}
