import makeCors from 'cors'
import express from 'express'
import makeHelmet from 'helmet'
import { Knex } from 'knex'
import morgan from 'morgan'

import { ExpressApplication } from '@/infrastructure/ExpressApplication'
import { StatusCode } from '@/library/http/common'
import { Route } from '@/library/http/Router'
import { Logger } from '@/library/logger/Logger'

import { assets, upload } from '../config/directory'
import legacyErrors from '../middlewares/erros-middleware'
import { generatePreview, reportPreview } from '../reports/controller'
import { routes as createEstadoRoutes } from './estado'
import { routes as createPaisRoutes } from './pais'
import { routes as createSoloRoutes } from './solo'

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
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  contentSecurityPolicy: {
    directives: {
      /* eslint-disable @stylistic/quotes -- CSP keywords require single quotes inside the string */
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'"
      ],
      scriptSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        'https:'
      ]
      /* eslint-enable @stylistic/quotes */
    }
  }
}

export function createApp({
  logger, cors, knex, legacyRouter
}: Parameters) {
  const routes: Route[] = [
    ...createPaisRoutes(knex),
    ...createEstadoRoutes(knex),
    ...createSoloRoutes(knex)
  ]
  const application = new ExpressApplication({ logger })

  application
    .use(makeHelmet(securityConfig))
    .use(makeCors({
      origin: cors.origins,
      methods: cors.methods,
      allowedHeaders: cors.allowedHeaders
    }))
    .use(morgan('dev', {
      skip: req => req.url === '/health'
    }))
    .get('/health', {
      handle() {
        return Promise.resolve({
          statusCode: StatusCode.Ok,
          body: { status: 'OK' }
        })
      }
    })
    // .use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    // .use('/fotos', express.static(upload))
    .use(
      '/assets',
      express.static(assets, {
        index: false,
        redirect: false,
        setHeaders: res => {
          res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
        }
      })
    )
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
